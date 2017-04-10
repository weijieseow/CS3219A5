var express = require('express');
var router = express.Router();
var shell = require('shelljs');
var git = require('simple-git');
var fs = require('fs');


router.get('/', function(req, res) {

  // git grep command to get all non-binary files in the latest version
  // for more accurate line attribution
  git(__dirname + "/../repo").raw([
    'grep',
    '-I', '-l',
    '-e', ''
    ], (err, result) => {
      if (err) {
        console.log('grep failed: ' + err);
        res.render('lines');
        return;
      }
      // result is a string of filenames separated by newline
      // process into an array of filenames for easier manipulation
      var fileNames = result.split("\n");

      // compute the number of lines by each author per file
      var count = {};
      var data;
      // git blame command for each file to get line attribution
      fileNames.forEach(file => {
        git(__dirname + '/../repo').raw([
          'blame',
          '--line-porcelain',
          file
        ], (err, result) => {
          if (err) {
            console.log('blame failed: ' + err);
          } else {
            // get the commit author for each line
            var authors = result.split("\n").filter(
              text => text.startsWith('author ')).map(text => text.substr(7));
            // count the occurrences of commit authors
            authors.forEach(e => {
              count[e] = (count[e] || 0) + 1;
            });
            
            // convert the object to array
            data = Object.keys(count).map(author => {
              return {
                author: author,
                count: count[author] 
              };
            });
            
            // console.log(data);
          }
        });
      });
      res.render('lines', {
        data: data
      });
    });  
});

module.exports = router;