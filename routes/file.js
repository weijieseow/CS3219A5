var express = require('express');
var router = express.Router();
var git = require('simple-git');
var fs = require('fs');
var bodyParser = require('body-parser');
var postprocessor = require('../data-controller/postprocessor.js');

var urlEncodoedParser = bodyParser.urlencoded({ extended: false });

// Define the variables that should be passed on to HTML here
var showBarchart = false
var dArrayOfCommits = []
var dArrayOfCommitNumber = []
var dArrayOfAddDelete = []
var showHistory = false 
var editHistoryArray = []
var lineStart = 0
var lineEnd = 0
var showBarchart = false

router.get('/', function(req, res) {

	// Render Page with empty / default variablesa
	res.render('file', {
		filepath: "Showing stats for file: " + req.session.filepath || "Filepath is invalid!",
		showBarchart: showBarchart,
		commitsArr: dArrayOfCommits || [],
		datasetNumCommits: dArrayOfCommitNumber || [],
		datasetAddDelete: dArrayOfAddDelete || [],
		showHistory: showHistory,
		editHistoryArray: editHistoryArray || [],
		lineStart: lineStart,
		lineEnd: lineEnd,
	});

	// DEBUG
	console.log("Current Repo: " + req.session.repo)
});

router.post('/filepath', urlEncodoedParser, function(req, res) {

	// Reset the arrays 
	dArrayOfCommits = []
	dArrayOfCommitNumber = []
	dArrayOfAddDelete = []

	// When filepath entered, should show bar chart
	showBarchart = true

	// Reset showHistory: Whenever file changes, history of edits should not be shown
	showHistory = false

   	var dataDict = {}

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

		//console.log("Array of Commits: ", dArrayOfCommits);

		// Go through every commit and consolidate stats per author
		for (var i = 0; i < dArrayOfCommits.length; i++) {
			var commit = dArrayOfCommits[i]
			var author = commit.author
			
			// If author is not in dictionary as a key, init new entry
			if (!(author in dataDict)) {
				dataDict[author] = {
					name: author,
					numCommits: 1,
					addition: commit.addition,
					deletion: commit.deletion,
				}

			} else {
				dataDict[author].numCommits += 1
				dataDict[author].addition = dataDict[author].addition + commit.addition
				dataDict[author].deletion = dataDict[author].addition + commit.deletion
			}
			
		}

		//console.log("Data Dict: ", dataDict)

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

			//console.log("For author" + currAuthor, dArrayOfCommitNumber)
		}

		req.session.filepathData = {
			commits: dArrayOfCommits,
			numCommits: dArrayOfCommitNumber,
			addDelete: dArrayOfAddDelete, 
		}

		//console.log("After Loop, Arr of Com Num")
		//console.log(dArrayOfCommitNumber)

		//console.log("Before Render, Arr of Com Num")
		//console.log(dArrayOfCommitNumber)

		// Render page now with the data
		res.render('file', {
			filepath: "Showing stats for file: " + req.session.filepath || "No file specified.",
			showBarchart: showBarchart,
			commitsArr: dArrayOfCommits || [],
			datasetNumCommits: dArrayOfCommitNumber || [],
			datasetAddDelete: dArrayOfAddDelete || [],
			showHistory: showHistory,
			editHistoryArray: editHistoryArray || [],
			lineStart: lineStart,
			lineEnd: lineEnd,
		});
	});
});

router.post('/codechunk', urlEncodoedParser, function(req, res) {

	// Replace old line variables
	let filepath = req.session.filepath
	lineStart = req.body.linestart
	lineEnd = req.body.lineend
   	//console.log("Before git log: ", filepath, lineStart, lineEnd);

   	// Reset array
   	editHistoryArray = []

   	// Pull data for part D
	git(__dirname + "/../repo").raw([
	'log',
	'--numstat',
	'--pretty="%n&&&%n-A%aN%n-D%ad%n-M%s"',
	'-L',
	lineStart + ',' + lineEnd + ':' + filepath
	], (err, result) => {
		//console.log(result)

		showHistory = true

		var allLines = result.split('\n')
		var arrayOfEdits = []
		var currentEdit = {}
		for (var i = 0; i < allLines.length; i++) {
			var currLine = allLines[i]

			// Custom indicator that it is a new Edit (MUST match the git log's pretty format)
			if (currLine == '&&&') {
				// If not reading the first Edit of the results, 
				// append the last created Edit object into the array
				arrayOfEdits.push(currentEdit)
				// Init new Edit object
				currentEdit = {
					author: "",
					date: "",
					msg: "",
					addition: 0,
					deletion: 0,
				}

			// Check for -A flag for author
			} else if (currLine.substring(0,2) == '-A') {
				currentEdit.author = currLine.substring(2)
			
			// Check for -D flag for date
			} else if (currLine.substring(0,2) == '-D') {
				currentEdit.date = currLine.substring(2)

			// Check for -M flag for message
			} else if (currLine.substring(0,2) == '-M') {
				currentEdit.msg = currLine.substring(2)

			// Check first 3 characters, if it is '+++' or '---', ignore
			} else if (currLine.substring(0, 3) == '+++') {
				continue
			} else if (currLine.substring(0, 3) == '---') {
				continue

			// If first char is '-' or '+', add to deletion / addition respectively
			} else if (currLine.substring(0, 1) == '-') {
				currentEdit.deletion++
			} else if (currLine.substring(0, 1) == '+') {
				currentEdit.addition++
			}
		}

		// Remove first element because it is always empty
		arrayOfEdits.shift();
		editHistoryArray = arrayOfEdits

		// Render page now with the data
		res.render('file', {
			filepath: "Showing stats for file: " + req.session.filepath || "No file specified.",
			showBarchart: showBarchart,
			commitsArr: dArrayOfCommits || [],
			datasetNumCommits: dArrayOfCommitNumber || [],
			datasetAddDelete: dArrayOfAddDelete || [],
			showHistory: showHistory,
			editHistoryArray: editHistoryArray || [],
			lineStart: lineStart,
			lineEnd: lineEnd,
		});

	});
});	


module.exports = router;