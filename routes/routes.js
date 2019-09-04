
var router = require('express').Router();
var path = require('path');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;

var User = require('../models/users');
var mailObj = require('../mailUtil');

router.get('/', function(req, res, next) {
  if(req.user && req.user.isVerifiedUser) {
    res.redirect('/users');
  } else {
    res.sendFile(path.join(__dirname, '../public/login.html'));
  }
});

router.get('/newRegistrant', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

router.get('/passwordChanged', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

router.get('/authFails', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

router.post('/register', function(req, res, next) {
  req.checkBody('newuser_firstName', 'First Name is required').notEmpty();
  req.checkBody('newuser_lastName', 'Last Name is required').notEmpty();
  req.checkBody('newuser_email', 'Email is not valid').isEmail();
  req.checkBody('newuser_password', 'Password is required').notEmpty();
  req.checkBody('newuser_password', 'Password must be of minimum 4 letters').isLength({min: 4, max: undefined});
  req.checkBody('newuser_confirm_password', 'Password is required').notEmpty();
  req.checkBody('newuser_confirm_password', 'Passwords do not match. Please re-check').equals(req.body.newuser_password);

  var validationErrors = req.validationErrors();

  if(validationErrors) {
    res.send({
      validationErrors: validationErrors
    });
  } else {
    let authToken = mailObj.generateToken();

    let newUser = new User({
      "firstName": req.body.newuser_firstName,
      "lastName": req.body.newuser_lastName,
      "email": req.body.newuser_email,
      "password": req.body.newuser_password,
      "authToken": authToken,
      "isAccountVerified": false
    });

    User.createUser(newUser, function(err, user) {
      if(err) {
        if(err.name == 'MongoError' && err.code == '11000') {
          res.send({
            validationErrors: [{
              param: 'newuser_email',
              msg: 'User with this E-Mail Address already exists!'
            }]
          });
          return;

        } else {
          req.flash('error_msg', 'Something Went Wrong!!!');
          console.error(err);
        }
      }
      
      User.sendMailUsingTemplateToUser('Task-Manager Registration Successful', newUser, 'registrationComplete', {userFirstName: newUser.firstName}, function(err, info) {
        console.log('inside registration successful template mail', info);
        res.send(''); 
	});
    });
  }
});

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.getUserById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(new localStrategy(
  function(username, password, done) {
    User.getUserByUserName(username, function(err, user) {
      if(err) {
        return done(err);
      }
      if(!user) {
        return done(null, false, {message: 'Unknown Email...'});
      }
      
      let pass = user.password;
      User.verifyPassword(password, pass, function(err, isVerifiedUser){
        if(err) {
          return done(err);
        }

        if(isVerifiedUser) {
          return done(null, user);
        }

        return done(null, false, {message: 'Wrong Password... Try Again!'});
      });
    });
  })
);

router.post('/login', passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/authFails'   
  }),
  function(req, res) {
    req.session.userID = req.user._id;
    req.session.userName = req.user.firstName;

    if(req.user.isAccountVerified) {
      res.redirect('/users');
    } else {
      let prev = req.user.mailCount.lastMailSend;
      let curr = new Date();

      if(prev.getFullYear() === curr.getFullYear() &&
        prev.getMonth() === curr.getMonth() &&
        prev.getDate() === curr.getDate() && req.user.mailCount.count >= 5) {
        
        res.render('authMail', {layout: 'other.handlebars', exceededMailSendLimit: true, err: null, resendBtnDisable: true});

        return;
      }
      
      let authToken = req.user.authToken;

      let mailText = 'Hi ' + req.user.firstName + ', Thanks for registering with us. Please use the authentication token to verify your account.';

      let mailContextObj = {
        heading: 'Authenticate Yourself',
        mailText: mailText,
        authToken: authToken
      }
      
      User.sendMailUsingTemplateToUser('Please Authenticate your account!', req.user, 'authTokenRelated', mailContextObj, function(err, info) {
        console.log('inside account auth', info);
        res.render('authMail', {layout: 'other.handlebars', err: null, resendBtnDisable: null});  //if an older registrant has not yet verified his/her account, take him/her to this page.
      });
    }
  }
);

router.get('/logout', function(req, res, next) {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});

router.get('/login', function (req, res, next) {
  res.redirect('/');
});

router.post('/changePassword', function(req, res, next) {
  if(req.body.fromForgotPassword == 'false') {
    req.checkBody('oldPassword', 'Old Password is required').notEmpty();
  }
  req.checkBody('newPassword', 'Password is required').notEmpty();
  req.checkBody('newPassword2', 'Confirm Password is required').notEmpty();
  req.checkBody('newPassword', 'Password must be of minimum 4 letters').isLength({min: 4, max: undefined});
  req.checkBody('newPassword2', 'Passwords do not match. Please re-check').equals(req.body.newPassword);

  var validationErrors = req.validationErrors();

  if(validationErrors) {
    res.send({
      validationErrors: validationErrors,
      customValidation: '',
      renderOldPassword: true
    });
    return;
  }

  if(req.body.fromForgotPassword == 'true') {
    User.updatePassword(req.session.userID, req.body.newPassword, function(err, user) {
      if(err) {
        req.flash('error_msg', 'Something Went Wrong!!!');
        console.error(err);
      } else {
        res.redirect('/passwordChanged');
      }
    });
  }
  else {
    User.verifyPassword(req.body.oldPassword, req.user.password, function(err, isVerifiedPassword) {
      if(err) {
        req.flash('error_msg', 'Something Went Wrong!!!');
        console.error(err);
        return;
      }
      
      let customValidation = {};
      if(!isVerifiedPassword) {
        customValidation = {
          "param": "oldPassword",
          "msg": "Please Enter the correct Password!"
        };
  
        res.send({
          validationErrors: validationErrors,
          customValidation: customValidation,
          renderOldPassword: true
        });
        return;
      }
  
      User.updatePassword(req.user._id, req.body.newPassword, function(err, user) {
        if(err) {
          req.flash('error_msg', 'Something Went Wrong!!!');
          console.error(err);
          return;
        }
        res.redirect('/passwordChanged');
      });
    });
  }

});

router.get('/forgotPasswordPage', function(req, res, next) {
  res.render('forgotPassword', {layout: 'other.handlebars'});
});

router.post('/forgotPasswordPage/sendAuth', function(req, res, next) {
  console.log('here in forgotPassword/sendAuth', req.body);
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();

  var validationErrors = req.validationErrors();
  if(validationErrors) {
    res.send({validationErrors: validationErrors});
  } else {
    User.getUserByUserName(req.body.email, function(err, user) {
      if(err) {
        req.flash('error_msg', 'Something Went Wrong!!!');
        console.error(err);
        return;
      }
      
      if(!user) {
        res.send({customValidation: {param: 'user_email', msg: 'The User doesn\'t exist.'}});
      } else {
        let prev = user.mailCount.lastMailSend;
        let curr = new Date();

        if(prev.getFullYear() === curr.getFullYear() &&
          prev.getMonth() === curr.getMonth() &&
          prev.getDate() === curr.getDate() && user.mailCount.count >= 5) {
          res.send({customValidation: {param: 'mailLimitExceeded', msg: 'Exceeded mail send limit, try again in 24 hours.'}});
          return;
        }

        let authToken = mailObj.generateToken();

        User.updateAuthToken(user._id, authToken, function(err) {
          if(err) {
            req.flash('error_msg', 'Something Went Wrong!!!');
            console.error(err);
            return;
          }

          let mailText = 'Hi, ' + user.firstName + '. Please enter the auth token to change your password.'

          let mailContextObj = {
            heading: 'Authenticate Yourself',
            mailText: mailText,
            authToken: authToken
          }

          User.sendMailUsingTemplateToUser('Forgot Login! Authenticate your account.', user, 'authTokenRelated', mailContextObj, function(err, info) {
            console.log('inside forgot password auth mail send', info);
            res.send({});
          });
        })
      }
    });
  }
});

router.post('/forgotPasswordPage/validateAuth', function(req, res, next) {
  console.log('here at forgot password validate auth');
  User.getUserByUserName(req.body.email, function(err, user) {
    if(err) {
      req.flash('error_msg', 'Something Went Wrong!!!');
      console.error(err);
      return;
    }
    if(req.body.authToken != user.authToken) {
      req.session.userID = user._id;
      res.send({customValidation: {param: 'FPAuthToken', msg: 'Wrong Auth Token. Please try again.'}});
    } else {
      res.send('');
    }
  });
});

router.get('/changeYourPassword', function(req, res, next) {
  res.render('changePassword', {layout: 'other.handlebars' , renderOldPassword: false});
});

router.post('/validateAuthToken', function(req, res, next) {
  if(req.user.authToken == req.body.authTokenInput) {
    User.setAccountVerified(req.user._id, function(err) {
      if(err) {
        res.locals.error_msg = err.msg;
        console.error(err);
      } else {
        

        let contextObj = {
          userFirstName: req.user.firstName,
          userLastName: req.user.lastName,
          userEmail: req.user.email
        }

        User.sendNewRegistrationInfoToOwner('Task-Manager New User Registered!', 'notifyOwnerAboutNewReg', contextObj, function(err, info) {
          if(err) {
            console.error(err);
          } else {
            console.log('mail sent to owner!!!', info);
          }
        });
        res.redirect('/users');
      }
    });
  } else {
    let resendBtnDisable =  (req.body.resendTokenBtnDisable == 'false') ? null: true;
    res.render('authMail', {layout: 'other.handlebars', err: 'Wrong Auth Token. Please enter a valid token!', resendBtnDisable: resendBtnDisable});
  }
});

router.get('/resendMail', function(req, res, next) {
  let authToken = req.user.authToken;

  let mailText = 'Hi ' + req.user.firstName + ', Thanks for registering with us. Please use the authentication token to verify your account.';

  let mailContextObj = {
    heading: 'Authenticate Yourself',
    mailText: mailText,
    authToken: authToken
  }

  User.sendMailUsingTemplateToUser('Please Authenticate your account!', req.user, 'authTokenRelated', mailContextObj, function(err, info) {
    console.log('inside account auth - resend token', info);
    res.render('authMail', {layout: 'other.handlebars', err: null, resendBtnDisable: true});  //if an older registrant has not yet verified his/her account, take him/her to this page.
  });

});

router.get('*', function (req, res, next) { 
  if(!req.user) {
    res.redirect('/');
  }
  else {
    next();
  }
});

module.exports = router;