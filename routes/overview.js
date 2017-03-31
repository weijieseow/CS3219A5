var express = require('express');
var router = express.Router();
var shell = require('shelljs');


router.get('/', function(req, res) {
	res.render('overview');
});



module.exports = router;
