var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fileUpload = require('express-fileupload');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var stopsRouter = require('./routes/stops');
var uploadRouter = require('./routes/upload');
var processRouter = require('./routes/process');
var loginRouter = require('./routes/login');
var instRouter = require('./routes/instrumentation');
var genRouter = require('./routes/generate');
var routesRouter = require('./routes/routes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
const cors = require('cors');
app.use(cors({ origin: true }));
app.use(logger('dev'));
app.use(express.json());
app.use(fileUpload());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/videos', express.static(__dirname + '/videos'));
app.use('/process', express.static(__dirname + '/process'));
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/stops', stopsRouter);
app.use('/upload', uploadRouter);
app.use('/process', processRouter);
app.use('/login', loginRouter);
app.use('/instrumentation', instRouter);
app.use('/generate', genRouter);
app.use('/routes', routesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  console.log('process not reached')
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
