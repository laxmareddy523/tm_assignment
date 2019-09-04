const nodemailer = require('nodemailer'),
      xoauth = require('xoauth2'),
      smtpTransport = require('nodemailer-smtp-transport'),
      tokenGenerator = require('rand-token'),
      hbs = require('nodemailer-express-handlebars');

var accessToken;

const config = require('./config/config.js');

var options = {
  viewEngine: {
      extname: '.handlebars'
  },
  viewPath: __dirname + '/public/views/emails/',
  extName: '.handlebars'
};

var generator = xoauth.createXOAuth2Generator({
  user: config.user,
  clientId: config.clientId,
  clientSecret: config.clientSecret,
  refreshToken: config.refreshToken
});

var transporter = nodemailer.createTransport(smtpTransport({
  service: "SMTP",
  host: "localhost",
  port: 2525,
  auth: {
    xoauth2: generator
  }
}));

transporter.use('compile', hbs(options));

transporter.on('token', function(accessToken) {
   accessToken: accessToken 
});

module.exports.generateToken = function() {
  let randToken = tokenGenerator.generator();
  return randToken.generate(4);
};

module.exports.transporter = transporter;

module.exports.sendMail = function(mailOptions, callback) {
  mailOptions.auth = {
    accessToken: accessToken,
    refreshToken: config.refreshToken
  }
  transporter.sendMail(mailOptions, callback);
};