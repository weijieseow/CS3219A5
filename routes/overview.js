var express = require('express');
var router = express.Router();
var shell = require('shelljs');
var git = require('simple-git');
var fileUtil = require('../util/fileUtil.js');
var postprocessor = require('../data-controller/postprocessor.js');


router.get('/', function(req, res) {

	var infoArray = [];
	var additionInfo = [];
	var deletionInfo = [];
	var commitInfo = [];

	console.log("current repo: " + req.session.repo);

	git(__dirname + "/../repo").raw([
		'log',
		'--pretty=format:%cN',
		], (err, result) => {

			var authorsArr = result.replace(/\n/g, ",").split(",");

			authorsArr = authorsArr.filter(function(elem, index, self) {
				return index == self.indexOf(elem);
			})

			authorsArr.forEach(function(author) {

				if (author != "GitHub") {
					infoArray.push({
						author : author,
						commits : 0,
						additions : 0,
						deletions : 0
					});
					additionInfo.push({
						label : author,
						value : 0,
					});
					deletionInfo.push({
						label : author,
						value : 0
					});
					commitInfo.push({
						label : author,
						value : 0
					})
				}
			});
		});

	git(__dirname + "/../repo").raw([
		'log',
		'--pretty=format:author:%cN',
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

							commitInfo.forEach(function(item) {
								if (item.label == author) {
									item.value++;
									return;
								}
							});

							infoArray.forEach(function(item) {
								if (item.author == author) {
									item.commits++;
									return;
								}
							});

						} else if (statsArr[i].includes("insertion")) {
							var insertionArr = statsArr[i].split("\\s+");

							infoArray.forEach(function(item) {
								if (item.author == author) {
									item.additions += parseInt(insertionArr[0]);
									return;
								}
							})

							additionInfo.forEach(function(item) {
								if (item.label == author) {
									item.value += parseInt(insertionArr[0]);
									return;
								}
							});


						} else if (statsArr[i].includes("deletion")) {
							var deletionArr = statsArr[i].split("\\s+");

							infoArray.forEach(function(item) {
								if (item.author == author) {
									item.deletions += parseInt(deletionArr[0]);
									return;
								}
							});

							deletionInfo.forEach(function(item) {
								if (item.label == author) {
									item.value += parseInt(deletionArr[0]);
									return;
								}
							});

						}
						i++;
					}
				}
				i++;
			}

			commitInfo = sortByValues(commitInfo);
			additionInfo = sortByValues(additionInfo);
			deletionInfo = sortByValues(deletionInfo);
			

			//console.log(commitInfo);
			//console.log(additionInfo);
			//console.log(deletionInfo);
			console.log(infoArray);



			/*var csv = postprocessor.convertArrayOfObjectsToCSV({
				data: infoArray
			});

			fileUtil.fileWriter('/../public/data/overview.csv', csv);*/

			res.render('overview', {
				repo: req.session.repo || "no repo",
				commitInfo: commitInfo,
				additionInfo: additionInfo,
				deletionInfo: deletionInfo,
				overallInfo : infoArray
			});

		});
});

function sortByValues(arrayOfObj) {
	var byValues = arrayOfObj.slice(0);
	byValues.sort(function(a,b) {
		return a.value - b.value;
	});

	return byValues;
}


module.exports = router;
