var express = require('express');
var router = express.Router();
var shell = require('shelljs');
var git = require('simple-git');
var fs = require('fs');
var fileUtil = require('../util/fileUtil.js');
var postprocessor = require('../data-controller/postprocessor.js');



router.get('/arr', function(req, res) {

	//Rui Wen Qn 1 part b and c
    //command: git log --shortstat --since=3.years --pretty=format:'%ad%n%an%n%s' --date=short --no-merges >output.txt

    var datebefore = req.params.datebefore;
    var dateafter = req.params.dateafter;
    var authors = req.query;

    var searchAuthor = [];
    Object.keys(authors).forEach(function (key) {
        searchAuthor.push(authors[key]);       
    });
    
    git(__dirname + "/../repo").raw([
		'log',
		'--shortstat',
        '--pretty=format:ad:%ad%nan:%an%nas:%s',
        '--date=short',
        '--no-merges',
		], (err, result) => {
        
        var lines =  result.split('\n');
        var dateArray = [];
        var authorArray = [];
        var messageArray = [];
        var changedFileArray = [];
        var additionArray = [];
        var deletionArray = [];
        
        var commitsPerDatePerAuthor = [];
        var eachCommitsArr = [];
        
        for(var i=0; i<lines.length; i++) {
            if (lines[i].startsWith('ad:')) {
                dateArray.push(lines[i++].substr(3));
                authorArray.push(lines[i++].substr(3));
                messageArray.push(lines[i++].substr(3));
                if (lines[i].trim().length > 0) {
                    let delimitedBySpace = lines[i].trim().split(",");
                    var changedFile = parseInt(delimitedBySpace[0]);
                    var addition = parseInt(delimitedBySpace[1]);
                    var deletion = parseInt(delimitedBySpace[2]);
                    changedFileArray.push((isNaN(changedFile) ? 0 : changedFile));
                    additionArray.push((isNaN(addition) ? 0 : addition));
                    deletionArray.push((isNaN(deletion) ? 0 : deletion));
                } else {
                    changedFileArray.push(0);
                    additionArray.push(0);
                    deletionArray.push(0);
                }
            }
        }
        
        authorArray.forEach(function(author, index) {

            var hasAuthor = false;
            for (var i = 0; i < searchAuthor.length && !hasAuthor; i++) {
              if (searchAuthor[i] === authorArray[index]) {
                hasAuthor = true;
              }
            }

            if (hasAuthor) {
                    eachCommitsArr.push({
                    date : dateArray[index],
                    author: authorArray[index],
                    message: messageArray[index],
                    changedFile : changedFileArray[index],
                    addition: additionArray[index],
                    deletion : deletionArray[index],
                });
                uniqueAuthorsArray = authorArray.filter(function(elem, index, self) {
                    return index == self.indexOf(elem);
                });
            }    
        });
        
        eachCommitsArr = sortByDate(eachCommitsArr);
        eachCommitsArr = sortByAuthor(eachCommitsArr);
        
        //console.log(eachCommitsArr);
        var commitCountPerDay = 0;
        var authorInOperation = eachCommitsArr[0].author;
        var dateInOperation = eachCommitsArr[0].date;
        var dayAddition = 0;
        var dayDeletion = 0;
        var authorCumAddition = 0;
        var authorCumDeletion = 0;
        var newSpace = "~";
        var newTab = "|";
        var details = [];
        
        eachCommitsArr.forEach(function(data, index) {
            
            if(eachCommitsArr[index].author != authorInOperation) {
                dateInOperation = eachCommitsArr[index].date;
                authorInOperation = eachCommitsArr[index].author;
                authorCumAddition = eachCommitsArr[index].addition; 
                authorCumDeletion = eachCommitsArr[index].deletion; 

                details = [];
                dayAddition = eachCommitsArr[index].addition; 
                dayDeletion = eachCommitsArr[index].deletion; 

            } else {
                authorCumAddition += eachCommitsArr[index].addition; 
                authorCumDeletion += eachCommitsArr[index].deletion;
                if(eachCommitsArr[index].date != dateInOperation){
                    dateInOperation = eachCommitsArr[index].date;
                    dayAddition = eachCommitsArr[index].addition; 
                    dayDeletion = eachCommitsArr[index].deletion; 
                    commitCountPerDay = 1; //reset to zero
                    details = [];
                    
                } else {
                    commitCountPerDay++;
                    dayAddition += eachCommitsArr[index].addition;
                    dayDeletion += eachCommitsArr[index].deletion;
                    if(index!=0) 
                        commitsPerDatePerAuthor.pop();
                }
            }
            
            detail = [eachCommitsArr[index].addition, eachCommitsArr[index].deletion, eachCommitsArr[index].message];
            details.push(detail);

            commitsPerDatePerAuthor.push({
                author: authorInOperation,
                date: dateInOperation,
                commitCount: commitCountPerDay,
                dayAddition: dayAddition,
                dayDeletion: dayDeletion,
                authorCumAddition: authorCumAddition,
                authorCumDeletion: authorCumDeletion,
                details: details
            })
            
        });
            
        

        //console.log(uniqueAuthorsArr);
        
        var csv = postprocessor.convertArrayOfObjectsToCSV({
				data: commitsPerDatePerAuthor
        });
        
        /*
        var csv2 = postprocessor.convertArrayOfObjectsToCSV({
				data: eachCommitsArr
        });
        */

        fileUtil.fileWriter('/../public/data/commitsPerDatePerAuthor.csv', csv);
        //fileUtil.fileWriter('/../public/data/eachCommitsArr.csv', csv2);


        res.render('authors', {
            repo: req.session.repo,
            commitsPerDatePerAuthor: commitsPerDatePerAuthor,
            eachCommitsArr: eachCommitsArr
        });
    });
});
function sortByAuthor(arrayOfObj) {
	var byAuthor = arrayOfObj.slice(0);
    byAuthor.sort(function(a,b) {
		var x = a.author.toLowerCase();
        var y = b.author.toLowerCase();
        if (x < y) {return -1;}
        if (x > y) {return 1;}
        return 0;
	});
	return byAuthor;
}

function sortByDate(arrayOfObj) {
	var byDate = arrayOfObj.slice(0);
	byDate.sort(function(a,b) {
        var x = new Date(a.date).getTime();
        var y = new Date(b.date).getTime();
        if (x > y) return 1;
        if (x < y) return -1;
        return 0;
	});

	return byDate;
}

module.exports = router;