
var express = require('express');
var router = express.Router();
var path = require('path');
var moment = require('moment');
var jwt = require('jsonwebtoken');

var Tasks = require('../models/tasks');
var Categories = require('../models/categories');

var config = require('../config/config.js');

router.get('/', function(req, res, next) {
  Tasks.getTasksOfThisUserSortByDate(req.session.userID, function(err, tasks) {
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
      return;
    }

    let prevDate = -1, taskArr = [], momentDate = -1;
    let dateWiseTasks = [];
    for (let i = 0; i < tasks.length; i++) {
      let task = tasks[i];
      if(task.is_done) continue;
      if(Date.parse(task.due_date) != prevDate && prevDate != -1) {
        dateWiseTasks.push({millisecondValue: prevDate, date: momentDate, tasks: taskArr});
        taskArr = [];
      }

      task.due_date_toShow = moment(tasks[i].due_date).format("MMM Do YYYY");
      task.createdDate_toShow = moment(tasks[i].createdDate).format("MMM Do YYYY");
      task.lastEditedDate_toShow = moment(tasks[i].lastEditedDate).format("MMM Do YYYY");
      task.doneDate_toShow = moment(tasks[i].doneDate).format("MMM Do YYYY");
      task.JWT_Id = getJWT(task._id);

      taskArr.push(task);
      prevDate = Date.parse(task.due_date);
      momentDate = task.due_date_toShow;
    }

    if(prevDate != -1) {
      dateWiseTasks.push({millisecondValue: prevDate, date: momentDate, tasks: taskArr});
      taskArr = [];
    }

    console.log('date wise tasks', dateWiseTasks);

    prevDate = -1, momentDate = -1;
    let dateWiseTasks_done = [], doneTaskArr = [];
    for (let i = 0; i < tasks.length; i++) {
      let task = tasks[i];
      if(!task.is_done) continue;
      if(Date.parse(task.due_date) != prevDate && prevDate != -1) {
        dateWiseTasks_done.push({millisecondValue: prevDate, date: momentDate, tasks: doneTaskArr});
        doneTaskArr = [];
      }

      task.due_date_toShow = moment(tasks[i].due_date).format("MMM Do YYYY");
      task.createdDate_toShow = moment(tasks[i].createdDate).format("MMM Do YYYY");
      task.lastEditedDate_toShow = moment(tasks[i].lastEditedDate).format("MMM Do YYYY");
      task.doneDate_toShow = moment(tasks[i].doneDate).format("MMM Do YYYY");
      task.JWT_Id = getJWT(task._id);
      
      doneTaskArr.push(task);
      prevDate = Date.parse(task.due_date);
      momentDate = task.due_date_toShow;
    }

    if(prevDate != -1) {
      dateWiseTasks_done.push({millisecondValue: prevDate, date: momentDate, tasks: doneTaskArr});
      doneTaskArr = []; 
    }

    console.log('date wise tasks done', dateWiseTasks_done);

    let hasTasks = dateWiseTasks.length | dateWiseTasks_done.length;
  
    if(res.locals.success_msg.toString() == "" && res.locals.error_msg.toString() == "") {
      res.render('index', {hasTasks: hasTasks, dateWiseTasks: dateWiseTasks, dateWiseTasks_done: dateWiseTasks_done, isActiveNavLink_Tasks: true, user: {firstName: req.user.firstName}});
      return;
    }

    var flashMsgObj = {
      success: res.locals.success_msg,
      error: res.locals.error_msg
    }

    console.log('flashMsg', flashMsgObj);
    res.render('index', {hasTasks: hasTasks, dateWiseTasks: dateWiseTasks, dateWiseTasks_done: dateWiseTasks_done, isActiveNavLink_Tasks: true, flashMsgObj: flashMsgObj, user: {firstName: req.user.firstName}});
  });
});

router.get('/addTask', function(req, res, next) {
  Categories.getAllCategoriesOfTheUser(req.session.userID, function(err, categories) {
    if(err) {
      throw err;
    }

    res.render('addTasks', {isActiveNavLink_AddTask: true, categories: categories, user: {firstName: req.user.firstName}});
  });
});

router.get('/editTask', function(req, res, next) {
  let taskId;

  try {
    taskId = verifyJWT(req.query.taskid).Id;
  } catch(err) {
    req.flash('error_msg', 'Something Went Wrong!!!');
    res.redirect('/');
    return;
  }
  
  Tasks.getTaskById(taskId, function(err, task) {
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
      return;
    }

    Categories.getAllCategoriesOfTheUser(req.session.userID, function(err, categories) {
      if(err) {
        req.flash('error_msg', 'Something Went Wrong!!!');
        console.error(err);
        return;
      }
      task.due_date_toShow = moment(task.due_date).format('YYYY-MM-DD');
      task.JWT_Id = getJWT(task._id);

      for (var i = 0; i < categories.length; i++) {
        categories[i].is_selected = (categories[i].skill_name == task.category);
      }

      res.render('editTask', {task: task, categories: categories, user: {firstName: req.user.firstName}});
    });

  });
});

router.post('/saveEditedTask', function(req, res, next) {
  let taskId;

  try {
    taskId = verifyJWT(req.query.taskid).Id;
    console.log('verify jwt', taskId)
  } catch(err) {
    req.flash('error_msg', 'Something Went Wrong!!!');
    console.error(err);
    return;
  }

  Tasks.updateTaskById(taskId, req.body, {new: true}, function(err, task) {
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
    } else {
      req.flash('success_msg', 'Task Edited Successfully!');
    }
    res.redirect('/users');
  });
});

router.post('/saveTask', function(req, res, next) {
  var task = new Tasks({
    "task_name": req.body.task_name,
    "category": req.body.category,
    "description": req.body.description,
    "is_urgent": req.body.is_urgent,
    "due_date": req.body.due_date,
    "is_done": req.body.is_done,
    "task_id": req.session.userID
  });

  Tasks.saveNewTask(task, function(err) {
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
    } else {
      req.flash('success_msg', 'Task Added Successfully!');
    }

    res.redirect('/users');
  });
});

router.delete('/deleteTask', function(req, res, next) {
  let taskId;

  try {
    taskId = verifyJWT(req.query.id).Id;
  } catch(err) {
    req.flash('error_msg', 'Something Went Wrong!!!');
    console.error('my error ', err);

    res.send();
    return;
  }

  Tasks.deleteTaskById(taskId, function(err, task) {
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
    } else {
      req.flash('success_msg', 'Task Deleted Successfully!');
    }

    res.send();
  });
});

router.get('/setTaskDone', function(req, res, next) {
  let taskId;

  try {
    taskId = verifyJWT(req.query.taskid).Id;
  } catch(err) {
    req.flash('error_msg', 'Something Went Wrong!!!');
    console.error('my error', err);

    res.redirect('/');
    return;
  }

  Tasks.setTaskDone(taskId, function (err) { 
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
    } else {
      req.flash('success_msg', 'Marked Done!');
    }
    res.redirect('/users');
  });
});

router.get('/setTaskActive', function(req, res, next) {
  let taskId;

  try {
    taskId = verifyJWT(req.query.taskid).Id;
  } catch(err) {
    req.flash('error_msg', 'Something Went Wrong!!!');
    console.error(err);

    res.redirect('/');
    return;
  }

  Tasks.setTaskActive(taskId, function (err) { 
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
    } else {
      req.flash('success_msg', 'Marked Active again!');
    }
    res.redirect('/users');
  });
});

router.get('/categories', function(req, res, next) {
  Categories.getAllCategoriesOfTheUser(req.session.userID, function(err, categories) {

    for (let i = 0; i < categories.length; i++) {
      categories[i].JWT_Id = getJWT(categories[i]._id);
    };

    if(res.locals.success_msg.toString() == "" && res.locals.error_msg.toString() == "") {
      res.render('categories', {categories: categories, isActiveNavLink_ManageCategories: true, user: {firstName: req.user.firstName}});
      return;
    }

    var flashMsgObj = {
      success: res.locals.success_msg,
      error: res.locals.error_msg
    }

    res.render('categories', {categories: categories, isActiveNavLink_ManageCategories: true, flashMsgObj: flashMsgObj, user: {firstName: req.user.firstName}});
  });
});

router.get('/editcategory', function(req, res, next) {
  var categoryid;

  try {
    categoryid = verifyJWT(req.query.id).Id;
  } catch(err) {
    req.flash('error_msg', 'Something Went Wrong!!!');
    console.error(err);

    res.redirect('/users/category');
    return;
  }

  Categories.getCategoryById(categoryid, function(err, category) {
    category.JWT_Id = getJWT(category._id);
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
    } else {
      res.render('editCategory', {category: category, user: {firstName: req.user.firstName}});
    }
  })
});

router.post('/saveEditedCategory', function(req, res, next) {
  var categoryid;

  try {
    categoryid = verifyJWT(req.query.id).Id;
  } catch(err) {
    req.flash('error_msg', 'Something Went Wrong!!!');
    console.error(err);

    res.redirect('/users/categories');
    return;
  }
  
  Categories.updateCategoryById(categoryid, req.body, {new: true}, function(err, category) {
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
    } else {
      req.flash('success_msg', 'Skill Edited Successfully!');
    }

    res.redirect('/users/categories');
  });
});

router.delete('/deleteCategory', function(req, res, next) {
  var categoryid;

  try {
    categoryid = verifyJWT(req.query.id).Id;
  } catch(err) {
    req.flash('error_msg', 'Something Went Wrong!!!');
    console.error(err);

    res.send();
    return;
  }

  Categories.deleteCategoryById(categoryid, function(err) {
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
    } else {
      req.flash('success_msg', 'Skill Deleted Successfully!');
    }

    res.send();
  });
});

router.get('/addCategory', function(req, res, next) {
  res.render('addCategory', {user: {firstName: req.user.firstName}});
});

router.post('/addThisCategory', function(req, res, next) {
  var category = new Categories({
    "skill_name": req.body.skill_name,
    "task_id": req.session.userID
  });

  let isFromModal = req.body.isFromModal;
  console.log('req', req.body);
  Categories.addNewCategory(category, function(err) {
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
    } else {
      req.flash('success_msg', 'Skill Added Successfully!');
    }

    if(isFromModal) {
      res.send();
    } else {
      res.redirect('/users/categories');
    }
  })
});

router.get('/changePasswordPage', function(req, res, next) {
  res.render('changePassword', {layout: 'other.handlebars' , renderOldPassword: true});
});

router.get('/logout', function(req, res, next) {
  console.log('here at logout 1');
});

module.exports = router;

function getJWT(Id) {  
  return jwt.sign({ Id }, 'supersecret');
}

function verifyJWT(token) {
  return jwt.verify(token, 'supersecret');
}