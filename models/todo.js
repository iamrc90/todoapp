var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ToDoSchema = new Schema({
	title : {
		type : 'String',
		required : true,
		minlength : 1,
		trim : true
	},
	completed : {
		type : Boolean,
		default : false
	},
	completed_at : {
		type : Date,
		default : null
	}
});

ToDoSchema.pre('findOneAndUpdate', function(next) {
  this.options.runValidators = true;
  next();
});

module.exports.ToDo = mongoose.model('ToDo',ToDoSchema);