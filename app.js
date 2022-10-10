var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var busboy = require('connect-busboy');

var indexRouter = require('./routes/index');
var processv2router = require('./routes/processv2');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
const cors = require('cors');
app.use(cors({ origin: true }));
app.use(logger('dev'));
app.use(express.json());
app.use('/v2/process', busboy(), processv2router);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', indexRouter);
app.use('/watch', express.static(__dirname + '/process'));
app.use('/spliced', express.static(path.join(__dirname, 'processing/speed')));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  console.log('process not reached')
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
