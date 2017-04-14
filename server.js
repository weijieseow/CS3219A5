var express = require('express');
var app = express();
var path = require('path');

var index = require('./routes/index');
var overview = require('./routes/overview');
var file = require('./routes/file');
var lines = require('./routes/lines');
var authors = require('./routes/authors');

// set up session middleware
var session = require('express-session');

app.set('port', (process.env.PORT || 3000));

app.use(session({
  secret: 'this15secret',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
  
app.use(express.static(path.join(__dirname, 'public')));
   
// index page
app.use('/', index);
app.use('/overview', overview);
app.use('/file', file);
app.use('/lines', lines);
app.use('/authors', authors);

app.use('*',function(req, res){
  res.send('Error 404: Not Found!');
});
  
// use npm run dev 
// to run the server
app.listen(app.get('port)',function(){
  console.log('Server running on port', app.get('port)'));
});