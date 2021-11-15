var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// Import the Database Object
const db = require('./database/connection')

// Import the Mongoose Models
var Author = require('./database/models/author')
var Book = require('./database/models/book')
var BookInstance = require('./database/models/bookinstance')
var Genre = require('./database/models/genre')

// Bind connection to the error event
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Create Instance and Save Instance in Database
// var awesomeBook = new SomeBook({title : "Sexus", author: "Henry Miller"})

// awesomeBook.save(err => {
//   if (err) return handleError(err)
// })

// Create Another Database Entry in somebooks
// SomeBook.create( {title: "Plexus", author: "Henry Miller"}, (err, awesomeBook) => {
//   if (err) return HandleError(err)
//   })

// Find Book by Author in Database
//  SomeBook.find({ 'author' : 'God'}, 'title', (err, booktitles) => {
//   if(err) return handleError(err);
//   console.log(booktitles)
//  })

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var catalogRouter = require('./routes/catalog');
var compression = require('compression')
var helmet = require('helmet')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(helmet())

app.use(compression()) // Compress all routes

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter); // Add catalog routes to middleware chain

// catch 404 and forward to error handler
app.use(function(req, res, next) {
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
