var express = require('express');
var router = express.Router();
var shell = require('shelljs');
var git = require('simple-git');
var fs = require('fs');


router.get('/', function(req, res) {

  if (req.session.repo == undefined) {
    res.render('lines', {
      repo: "no repo",
      data: undefined
    });
  }
  else {
    if (req.session.lines && req.session.lines.url === req.session.repo) {
    // retrieve from cache
    console.log('retrieved from cache');
    
    res.render('lines', {
      repo: req.session.repo,
      data: req.session.lines.data
    });
    return;
    }

    // git grep command to get all non-binary files
    // checking only non-binary files will provide more accurate line attribution
    git(__dirname + "/../repo").raw([
      'grep',
      '-I', '-l',
      '-e', ''
      ], (err, result) => {
        if (err || result == null) {
          res.redirect('/error');
          return;
        }
      
        // result is a string of filenames separated by newline
        // process into an array of filenames for easier manipulation
        var fileNames = result.split("\n");

        // get line attribution using git blame command
        // wrap each command in a Promise as they are executed asynchronously
        var promises = fileNames.map(file => {
          return new Promise((resolve, reject) => {
            git(__dirname + '/../repo').raw([
              'blame',
              '--line-porcelain',
              file
            ], (err, result) => {
              if (err) {
                return resolve([]); // return an empty array
              }
              
              // get the commit author for each line
              var authors = result.split("\n")
                            .filter(text => text.startsWith('author '))
                            .map(text => text.substr(7));
              resolve(authors);
            });
          });
        });
      
        // execute all commands, then compute the number of lines by each author per file
        Promise.all(promises).then(files => {
          var count = {};
          files.forEach(file => {
            file.forEach(author => {
              count[author] = (count[author] || 0) + 1;
            });
          });
          
          // convert the object to array
          data = Object.keys(count).map(author => {
            return {
              author: author,
              count: count[author] 
            };
          });
          
          // console.log(data);
          
          // save to cache
          req.session.lines = {
            url: req.session.repo,
            data: data
          };
          
          res.render('lines', {
            repo: req.session.repo,
            data: data
          });
        });
        
      });  
    }
  
});

module.exports = router;