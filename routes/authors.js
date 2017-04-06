var express = require('express');
var router = express.Router();
var shell = require('shelljs');
var git = require('simple-git');
var fs = require('fs');


router.get('/', function(req, res) {

	res.render('authors');
});

module.exports = router;