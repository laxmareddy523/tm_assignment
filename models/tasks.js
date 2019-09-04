const mongoose = require('mongoose');

var Schema = mongoose.Schema;

// Task Schema
var TaskSchema = new Schema({
  "task_name": {
    type: String,
    trim: true
  },
  "category": {
    type: String,
    trim: true
  },
  "is_urgent": {
    type: Boolean,
  },
  "description": {
    type: String,
    trim: true
  },
  "due_date": {
    type: Date,
  },
  "createdDate": {
    type: Date,
    default: Date.now
  },
  "lastEditedDate": {
    type: Date,
    default: Date.now
  },
  "task_id": {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  "is_done": {
    type: Boolean,
    default: false
  },
  "doneDate": {
    type: Date,
    default: Date.now
  }
});

var Tasks = module.exports = mongoose.model('assignment_result', TaskSchema);

module.exports.getTasksOfThisUser = function(userId, callback) {
  Tasks.find({task_id: userId}, callback);
 };

module.exports.getTasksOfThisUserSortByDate = function(userId, callback) {
  Tasks.find({task_id: userId}).sort({due_date: 'asc'}).exec(callback);
}

module.exports.getTaskById = function(taskId, callback) {
  Tasks.findById(taskId, callback);
}

module.exports.updateTaskById = function(taskId, task, option, callback) {
  Tasks.findByIdAndUpdate(taskId, task, option, callback);
}

module.exports.saveNewTask = function(task, callback) {
  task.save(function(err) {
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
      return;
    }

    Tasks.findById(task._id)
          .populate('task_id')
          .exec(callback);
  });
}

module.exports.deleteTaskById = function(taskId, callback) {
  Tasks.findByIdAndRemove(taskId, callback);
}

module.exports.setTaskDone = function(taskId, callback) {
  Tasks.findByIdAndUpdate(taskId, {is_done: true, doneDate: new Date()}, {new: true}, callback);
}

module.exports.setTaskActive = function(taskId, callback) {
  Tasks.findByIdAndUpdate(taskId, {is_done: false}, {new: true}, callback);
}