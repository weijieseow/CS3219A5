var express = require('express');
var router = express.Router();
var shell = require('shelljs');


router.get('/', function(req, res) {
    console.log("current repo: " + req.session.repo);
	res.render('overview', {
        repo: req.session.repo || "No repository specified"
    });
});



module.exports = router;
