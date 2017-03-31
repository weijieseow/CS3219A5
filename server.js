var express = require('express');
var app = express();
var path = require('path');

var index = require('./routes/index');
var overview = require('./routes/overview');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
  
app.use(express.static(path.join(__dirname, 'public')));
   
// index page
app.use('/', index);
app.use('/overview', overview);

app.use('*',function(req, res){
  res.send('Error 404: Not Found!');
});
  
// use npm run dev 
// to run the server
app.listen(3000,function(){
  console.log('Server running at Port 3000');
});