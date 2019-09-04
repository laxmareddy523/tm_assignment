var express = require('express'),
      bodyParser = require('body-parser'),
      path = require('path'),
      serveFavicon = require('serve-favicon'),
      mongoose = require('mongoose'),
      passport = require('passport'),
      localStrategy = require('passport-local').Strategy,
      exphbs = require('express-handlebars'),
      flash = require('connect-flash'),
      session = require('express-session'),
      cookieParser = require('cookie-parser'),
      expressValidator = require('express-validator')
      morgan = require('morgan');

const config = require('./config/config.js');
const logger = require('./commons/logger')

const PORT = 3000;


var uri = config.mlabUri;

mongoose.connect(uri, {useMongoClient: true}, function(err) {
  if(err) {
    return console.error(err);
  }
  console.log('connected to Database!!!');
});

var app = express();


app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'public/views'));
app.engine('handlebars', exphbs({defaultLayout: 'main.handlebars', layoutsDir: __dirname + '/public/views/layouts'}));
app.set('view engine', 'handlebars');


app.use(bodyParser.urlencoded({ extended: false }))


app.use(bodyParser.json());
app.use(cookieParser('your secret here'));



app.use(session(
  config.sessionObj
));

app.use(flash());


app.use(passport.initialize());
app.use(passport.session());


app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});


app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
    var namespace = param.split('.')
    , root    = namespace.shift()
    , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));


var routes = require('./routes/routes');
var userRoutes = require('./routes/userRoutes');

app.use('/', routes);
app.use('/users', userRoutes);


app.get('*', function (req, res, next) {
  res.send('<div style="text-align: center; margin-top: 30px;"><h2>SORRY NO SUCH URL EXISTS!!!</h2><h2 style="color: grey;">404 NOT FOUND</h2></div>');
}); 

app.listen(PORT, function() {
  console.log('magic is happening at ' + PORT + '!!!');
});