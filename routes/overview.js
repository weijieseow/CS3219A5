var express = require('express');
var router = express.Router();
var shell = require('shelljs');
var git = require('simple-git');
var fileUtil = require('../util/fileUtil.js');
var postprocessor = require('../data-controller/postprocessor.js');


router.get('/', function(req, res) {

	var infoArray = [];

	console.log("current repo: " + req.session.repo);

	git(__dirname + "/../repo").raw([
		'log',
		'--pretty=format:%aN',
		], (err, result) => {

			var authorsArr = result.replace(/\n/g, ",").split(",");

			authorsArr = authorsArr.filter(function(elem, index, self) {
				return index == self.indexOf(elem);
			})

			authorsArr.forEach(function(author) {
				infoArray.push({
					author : author,
					additions : 0,
					deletions : 0
				});
			});
		});

	git(__dirname + "/../repo").raw([
		'log',
		'--pretty=format:author:%aN',
		'--shortstat',
		], (err, result) => {
			var statsArr = result.replace(/\n/g, ",").split(",");
			//console.log(statsArr);

			var i = 0;

			while(i < statsArr.length) {
				if (statsArr[i].includes("author:")) {
					var author = statsArr[i].slice(7);
					while (statsArr[i] != '') {
						if (statsArr[i].includes("author:")) {
							author = statsArr[i].slice(7);

						} else if (statsArr[i].includes("insertion")) {
							var insertionArr = statsArr[i].split("\\s+");

							infoArray.forEach(function(item) {
								if (item.author == author) {
									item.additions += parseInt(insertionArr[0]);
									return;
								}
							})


						} else if (statsArr[i].includes("deletion")) {
							var deletionArr = statsArr[i].split("\\s+");

							infoArray.forEach(function(item) {
								if (item.author == author) {
									item.deletions += parseInt(deletionArr[0]);
									return;
								}
							})

						}
						i++;
					}
				}
				i++;
			}
			
			console.log(infoArray);
			var csv = postprocessor.convertArrayOfObjectsToCSV({
				data: infoArray
			});

			fileUtil.fileWriter('/../public/data/overview.csv', csv);

			res.render('overview', {
				repo: req.session.repo || "No repository specified",
				data: infoArray
			});
			
		});
});



module.exports = router;
