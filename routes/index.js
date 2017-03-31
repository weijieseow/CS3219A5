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

router.post('/url', urlEncodoedParser, function(req, res) {
   console.log(req.body.url); // url of repo
   
   req.session.repo = req.body.url; // save the repo in current session

   shell.cd(__dirname + "/..");
   shell.exec('rm -rf repo');

   clone(req.body.url, __dirname + "/../repo", function() {
   	//process data here using the cloned repo in {working directory}/repo
   	//store the data as csv files in public/data
   	
   	//var contributions = shell.exec('git shortlog -s -n ' + __dirname + '/../repo', {silent:false}).stdout;
	
   	res.redirect('/overview');
   });
});

module.exports = router;