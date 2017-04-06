var fs = require('fs');
var exports = module.exports = {};

exports.fileWriter = function(path, data) { 
	fs.writeFile(__dirname + path, data, 'utf8', function (err) {
		if (err) {
			console.log('Some error occured - file either not saved or corrupted file saved.');
		} else {
			console.log('It\'s saved!');
		}
	}); 
}

