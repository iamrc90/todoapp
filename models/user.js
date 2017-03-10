const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _   = require('lodash');
const bcrypt = require('bcryptjs');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	email : {
		type : 'String',
		required : true,
		minlength : 1,
		trim : true,
		unique : true,
		validate : {
			validator : validator.isEmail,
			message : '{VALUE} is not a valid email'
		}
	},
	password : {
		type : String,
		required : true,
		minlength : 6
	},
	tokens : [{
		access: {
			type : String,
			required: true
		},
		token: {
			type: String,
			required : true
		},
		expires_on : {
			type : Date,
			default: new Date(+new Date() + 2 * 60 * 60 * 1000)
		}
	}]
});


UserSchema.methods.toJSON = function() {
	var user = this;
	var userObject = user.toObject();

	return _.pick(userObject,['_id','email']);
}

UserSchema.methods.generateNewToken = function(tokenType) {
	var user = this;
	var access = tokenType;
	var token = jwt.sign({_id:user._id.toHexString(),access},'mysecretsaltanditisverysalty');
	user.tokens.push({ access, token });

	return user.save().then(() => {
		return token;
	});
}


UserSchema.methods.removeToken = function(token) {
	var user = this;
	return user.update({
		$pull : {
			tokens : {token}
		}
	});
}

UserSchema.pre('save', function(next){
	var user = this;
	if(user.isModified('password')) {
		bcrypt.genSalt(10 ,(err,salt) => {
			bcrypt.hash(user.password,salt, (err,hash) => {
				user.password = hash;
				next();
			});
		}); 
	} else {
		next();
	}
});


UserSchema.statics.findByToken = function(token) {
	var User = this;
	var decoded;

	try {
		decoded = jwt.verify(token,'mysecretsaltanditisverysalty');
	}catch(e) {
		return Promise.reject();
	}

	return User.findOne({
		'_id' : decoded._id,
		'tokens.token' : token,
		'tokens.access' : 'auth'
	});
}

UserSchema.statics.findByCredentials = function(email,password) {
	var User = this;
	
	return User.findOne({email}).then((user) => {
		if(!user) {
			return Promise.reject();
		}

		return new Promise((resolve,reject) => {
			bcrypt.compare(password,user.password , (err,result) => {
				if(result) {
					resolve(user);
				}else {
					reject();
				}
			});
		});
	});
}

module.exports.User = mongoose.model('User',UserSchema);