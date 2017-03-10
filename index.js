const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const jwt = require('jsonwebtoken');
var app = express();

const {mongoose} = require('./db/connection');
const {ToDo}     = require('./models/todo');
const {User}     = require('./models/user');


/*Middleware*/
const {auth} = require('./middleware/auth');
/*Middleware End*/
/*Let the body parser parser the json and url encoded values*/

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended : true
}));

app.get('/', (req,res) => {
	res.send('welcome to our api');
});



/*User API's*/

/*Simple Sign up */
app.post('/users', (req,res) => {
	var body = _.pick(req.body, ['email','password']);
	var user = new User(body);

	// save the user
	user.save().then(() => {
		res.send(user);
	})
	.catch((e) => {
		res.status(400).send(e);
	});
});

/* Login Api */
app.post('/users/login', (req,res) => {
	var body = _.pick(req.body,['email','password']);
	var userObject;
	User.findByCredentials(body.email,body.password)
		.then((user) => {
			userObject = user;
			return userObject.generateNewToken('auth'); 
		})
		.then((token) => {
			res.header('x-auth',token).send(userObject);
		})
		.catch((e) => {
			res.status(400).send();
		});
});

// use auth middleware for every route after this line
app.use(auth);

app.delete('/users/logout',(req,res) => {
	var user = req.user;
	user.removeToken(req.token).then(() => {
		res.status(200).send();
	}).catch((e) => {
		res.status(400).send();
	});
});

app.get('/todo/list', (req,res) => {
	ToDo.find().then(
		(docs) => {
			res.json(docs);
		},
		(err) => {
			console.log("Unable to fetch todos",err);
			res.json({
				status : 500,
				message : err
			});
		}
	);
	
});


app.get('/todo/:id', (req, res) => {
	if(req.params.id !== undefined) {
		ToDo.findOne({
			_id : req.params.id
		})
		.then(
			(doc) => {
				res.json({
					status : 200,
					data : doc
				});
			},
			(err) => {
				res.json({
					status : 500,
					message : 'Server Error!'
				});
			}
		);
	}else {
		res.json({
			status : 400,
			message : 'Please pass the id of the todo!'
		});
	}
});

app.post('/todo', (req, res) => {
	var newTodo = new ToDo();
	newTodo.title = req.body.title;
	newTodo.save().then(
		(doc) => {
			res.json({
				status : 200,
				message : 'ToDo has been saved'
			});
		},
		(err) => {
			res.json({
				status : 500,
				message : 'Unable to save todo'
			});
		}
	);

});

app.put('/todo', (req, res) => {
	if(req.body.id) {
		ToDo.findOneAndUpdate(
			{
				_id : req.body.id
			},
			{
				$set : {
					title : req.body.title
				}
			},
			{
				new : true,
				runValidators: true
			}
		).then(
			(doc) => {
				res.json({
					status : 200,
					message : `Updated ${doc}`
				});
			},
			(err) => {
				res.json({
					status : 500,
					message : 'Unable to update'
				});
			}
		);
	} else {
		res.json({
			status : 400,
			message : 'Please send the todo id'
		});
	}
});

app.delete('/todo', (req, res) => {
	if(req.body.id) {
		ToDo.findOneAndRemove(
			{
				_id : req.body.id
			})
			.then(
				(doc) => {
					res.json({
						status : 200,
						message : `Removed ${doc}`
					});
				},
				(err) => {
					res.json({
						status : 500,
						message : 'Unable to delete'
					});
				}
		);
	} else {
		res.json({
			status : 400,
			message : 'Please send the todo id'
		});
	}
});

app.listen(3000,() => {
	console.log('Running on port 3000');
});