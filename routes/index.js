var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');

var urlEncodoedParser = bodyParser.urlencoded({ extended: false });

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index');
});

router.post('/url', urlEncodoedParser, function(req, res){
   // req.body object has your form values
   console.log(req.body.url);
   res.render('index');
});

module.exports = router;