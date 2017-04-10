var express = require('express');
var router = express.Router();
var shell = require('shelljs');
var git = require('simple-git');
var fs = require('fs');


router.get('/', function(req, res) {

	res.render('file');

	console.log("Current Repo: " + req.session.repo)
});

router.post('/filepath', urlEncodoedParser, function(req, res) {
   console.log(req.body.filepath); // Filepath to be inspected
   
   req.session.repo = req.body.url; // save the repo in current session

   shell.cd(__dirname + "/..");
   shell.exec('rm -rf repo');

   clone(req.body.url, __dirname + "/../repo", function() {
   	//process data here using the cloned repo in {working directory}/repo
   	//store the data as csv files in public/data
   	
   	//git(__dirname + "/../repo").status((err, summary) => console.log(summary));

   	res.redirect('/overview');
   });
});

module.exports = router;