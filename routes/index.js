var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var clone = require('git-clone');
var shell = require('shelljs');

var urlEncodoedParser = bodyParser.urlencoded({ extended: false });

/* GET home page. */
router.get('/', function(req, res) {
	res.render('index');
});

router.post('/url', urlEncodoedParser, function(req, res){
   console.log(req.body.url); // url of repo

   shell.cd(__dirname + "/..");
   shell.exec('rm -rf repo');

   clone(req.body.url, __dirname + "/../repo");
   res.redirect('/');
});

module.exports = router;