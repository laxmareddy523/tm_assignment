const mongoose = require('mongoose'),
      bcrypt = require('bcryptjs');

var mailObj = require('../mailUtil');
var config = require('../config/config.js');

var Schema = mongoose.Schema;

// User Schema.
var UserSchema = new Schema({
  "firstName": {
    type: String,
    trim: true
  },
  "lastName": {
    type: String,
    trim: true
  },
  "email": {
    type: String,
    index: true,
    trim: true
  },
  "password": {
    type: String,
    trim: true
  },
  "authToken": {
    type: String,
    trim: true,
    required: true
  },
  "isAccountVerified": {
    type: Boolean,
    default: false
  },
  "mailCount": {
    "lastMailSend": {
      type: Date,
      default: Date.now
    },
    "count": {
      type: Number,
      default: 0
    }
  }
});

var User =  module.exports = mongoose.model('user', UserSchema);

module.exports.createUser = function(newUser, callback) {
  bcrypt.genSalt(10, function(err, salt) {
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
      return;
    }

    bcrypt.hash(newUser.password, salt, function(err, hash) {
        newUser.password = hash;
        newUser.save(callback);
    });
  });
};

module.exports.getUserByUserName = function(user_email, callback) {
  User.findOne({email: user_email}, callback);
};

module.exports.verifyPassword = function(user_password, pass, callback) {
  bcrypt.compare(user_password, pass, function(err, isVerifiedUser) {
     return callback(err, isVerifiedUser);
  });
};

module.exports.getUserById = function(Id, callback) {
  User.findById(Id, callback);
};

module.exports.updateAuthToken = function(Id, authToken, callback) {
  User.findByIdAndUpdate(Id, {authToken: authToken}, callback);
};

module.exports.setAccountVerified = function(Id, callback) {
  User.findByIdAndUpdate(Id, { isAccountVerified: true }, callback);
};

module.exports.updatePassword = function(Id, newPassword, callback) {
  bcrypt.genSalt(10, function(err, salt) {
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
      return;
    }
    bcrypt.hash(newPassword, salt, function(err, passwordHash) {
      User.findByIdAndUpdate(Id, { password: passwordHash }, callback);
    });
  });
};

module.exports.sendMailToUser = function(subject, text, userMailId, callback) {
  mailObj.sendMail({
    from: config.mailSender,
    to: userMailId,
    subject: subject,
    text: text
  }, function(err, info) {
    callback(err, info);
  });
};

module.exports.sendMailUsingTemplateToUser = function(subject, user, template, contextObj, callback) {
  mailObj.sendMail({
    from: config.mailSender,
    to: user.email,
    subject: subject,
    template: template,
    context: contextObj
  }, function(err, info) {
    updateMailCount(user._id, user.mailCount, function (err_) {
      callback(err, info);
    });
  });
};

module.exports.sendNewRegistrationInfoToOwner = function(subject, template, contextObj, callback) {
  mailObj.sendMail({
    from: config.mailSender,
    to: config.realOwner,
    subject: subject,
    template: template,
    context: contextObj
  }, function(err, info) {
    callback(err, info);
  });
};

var updateMailCount = function (Id, mailCountObj, callback) {
  let prev = mailCountObj.lastMailSend;
  let curr = new Date();

  if(prev.getFullYear() === curr.getFullYear() &&
    prev.getMonth() === curr.getMonth() &&
    prev.getDate() === curr.getDate()) {
      mailCountObj.count++;
  } else {
    mailCountObj.lastMailSend = new Date();
    mailCountObj.count = 1;
  }

  User.findByIdAndUpdate(Id, {mailCount: mailCountObj}, callback);
};