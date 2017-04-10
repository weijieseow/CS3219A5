var express = require('express');
var router = express.Router();
var git = require('simple-git');
var fs = require('fs');
var bodyParser = require('body-parser');
var postprocessor = require('../data-controller/postprocessor.js');

var urlEncodoedParser = bodyParser.urlencoded({ extended: false });

// Define the variables that should be passed on to HTML here
var dArrayOfCommits = []
var dArrayOfCommitNumber = []
var dArrayOfAddDelete = [] 

router.get('/', function(req, res) {

	// Render Page with empty / default variablesa
	res.render('file', {
		filepath: "Showing stats for file: " + req.session.filepath || "No file specified.",
		commitsArr: dArrayOfCommits || [],
		datasetNumCommits: dArrayOfCommitNumber || [],
		datasetAddDelete: dArrayOfAddDelete || [],
	});

	// DEBUG
	console.log("Current Repo: " + req.session.repo)
});

router.post('/filepath', urlEncodoedParser, function(req, res) {

	// Remember to reset the arrays 
	dArrayOfCommits = []

   	var dataDict = {}
	var newStatsObject = {
		numCommits: 0,
		addition: 0,
		deletion: 0,
	}

	var dAuthorsArr = [];
	var dCommitMsgArr = [];
	var dAdditionsArr = [];
	var dDeletionsArr = [];

   let filepath = req.body.filepath
   req.session.filepath = filepath
   console.log(filepath); // Filepath to be inspected

   // Pull data for part D
	git(__dirname + "/../repo").raw([
	'log',
	'--follow',
	'--numstat',
	'--pretty=format:"%aN%n%s"',
	filepath,
	], (err, result) => {

		//console.log(result)

		// TODO: Check for null result 

		var lines = result.split('\n') 
		for(var i = 0; i < lines.length; i++){
			
			let line = lines[i]
			// Every multiple of 4 (starting from 0) is the NAME, without first char (")
			if (i%4 == 0) {
				dAuthorsArr.push(line.substring(1))

			// This line is  commit msg without last char (")
			} else if (i%4 == 1) {
				dCommitMsgArr.push(line.slice(0, -1)) 
			
			// this line is addition and deletions
			} else if (i%4 == 2) {
				let delimitedByTab = line.split('\t')
				dAdditionsArr.push(parseInt(delimitedByTab[0]))
				dDeletionsArr.push(parseInt(delimitedByTab[1]))  				
			}

		}

		// Combine arrays into an array of JSON objects repsenting a commit
		for (var i = 0; i < dAuthorsArr.length; i++) {
			var dObject = {
				author: dAuthorsArr[i],
				addition: dAdditionsArr[i],
				deletion: dDeletionsArr[i],
				msg: dCommitMsgArr[i],
			}

			dArrayOfCommits.push(dObject)
		}

		//console.log(dArrayOfCommits);

		// Go through every commit and consolidate stats per author
		for (var i = 0; i < dArrayOfCommits.length; i++) {
			var commit = dArrayOfCommits[i]
			var author = commit.author
			
			// If author is not in dictionary as a key, init new entry
			if (!dataDict.hasOwnProperty(author)) {
				dataDict[author] = newStatsObject
			} 

			dataDict[author].numCommits += 1
			dataDict[author].addition += commit.addition
			dataDict[author].deletion += commit.deletion
		}

		// Iterate through dictionary to create the respective datasets (array of JSONs) needed for d3

		// Get list of unique keys in dict
		var uniqueAuthors = [];
		for (var author in dataDict) {
			if (dataDict.hasOwnProperty(author)) {
				uniqueAuthors.push(author);
			}
		}

		// Get the stats JSON object for every key 
		for (var i = 0; i < uniqueAuthors.length; i++) {
			var currAuthor = uniqueAuthors[i]
			
			var numCommitsStat = {
				label: currAuthor,
				value: dataDict[currAuthor].numCommits
			}

			var addDeleteStat = {
				author: currAuthor,
				addition: dataDict[currAuthor].addition,
				deletion: dataDict[currAuthor].deletion,
			}

			dArrayOfCommitNumber.push(numCommitsStat)
			dArrayOfAddDelete.push(addDeleteStat)
		}

		req.session.filepathData = {
			commits: dArrayOfCommits,
			numCommits: dArrayOfCommitNumber,
			addDelete: dArrayOfAddDelete, 
		}

		console.log("After JS: ", dArrayOfCommits)
		
	});

	// Render page now with the data
	res.render('file', {
		filepath: "Showing stats for file: " + req.session.filepath || "No file specified.",
		commitsArr: dArrayOfCommits || [],
		datasetNumCommits: dArrayOfCommitNumber || [],
		datasetAddDelete: dArrayOfAddDelete || [],
	});
});

router.post('/codechunk', urlEncodoedParser, function(req, res) {

	let filepath = req.session.filepath
	let lineStart = req.body.linestart
	let lineEnd = req.body.lineend
   	//console.log("Before git log: ", filepath, lineStart, lineEnd);

   	// Pull data for part D
	git(__dirname + "/../repo").raw([
	'log',
	'--numstat',
	'--pretty="%n@@@@%n%aN%n%ad%n%s"',
	'-L',
	lineStart + ',' + lineEnd + ':' + filepath
	], (err, result) => {
		console.log(result)
	});

	// Render page now with the data
	res.render('file', {
		filepath: "Showing stats for file: " + req.session.filepath || "No file specified.",
		commitsArr: dArrayOfCommits || [],
		datasetNumCommits: dArrayOfCommitNumber || [],
		datasetAddDelete: dArrayOfAddDelete || [],
	});

});	



module.exports = router;