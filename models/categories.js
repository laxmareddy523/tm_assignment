const mongoose = require('mongoose');

var Schema = mongoose.Schema;

// Category Schema
var CategorySchema = new Schema({
  "skill_name": {
    type: String,
    trim: true
  },
  "createdDate": {
    type: Date,
    default: Date.now
  },
  "task_id": {
    type: Schema.Types.ObjectId,
    ref: 'user'
  }
});

var Categories = module.exports = mongoose.model('team_skills', CategorySchema); 

module.exports.getAllCategoriesOfTheUser = function(userId, callback) {
  Categories.find({task_id: userId}, callback);
}

module.exports.getCategoryById = function(categoryId, callback) {
  Categories.findById(categoryId, callback);
}

module.exports.updateCategoryById = function(categoryid, category, option, callback) {
  Categories.findByIdAndUpdate(categoryid, category, option, callback);
}

module.exports.deleteCategoryById = function(categoryid, callback) {
  Categories.findByIdAndRemove(categoryid, callback);
}

module.exports.addNewCategory = function(category, callback) {
  category.save(function(err) {
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
      return;
    }

    Categories.findById(category._id)
      .populate('task_id')
      .exec(callback);
  });
}