const {User} = require('./../models/user');

var auth = (req,res,next) => {
	var token = req.header('x-auth');

	User.findByToken(token)
		.then((user) => {
			console.log(user);
			if( !user ) {
				return Promise.reject();
			}

			req.user = user;
			req.token = token;
			console.log('passed');
			next();
		})
		.catch((e)=>{
			res.status(401).send();
		});
};

module.exports = {auth};