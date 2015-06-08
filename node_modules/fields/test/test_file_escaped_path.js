var fields = require('../lib'),
	fs = require('fs');

fields.file({
	title: 'Enter the project directory',
	desc: 'Any directory will do',
	complete: true,
	showHidden: false,
	ignoreDirs: /^(\$RECYCLE\.BIN)$'/,
	ignoreFiles: /file/
}).prompt(function (err, value) {
	if (err) {
		process.stdout.write('\n');
		process.exit(0);
	} else {
		fs.exists(value, function(exists) {
			console.log(value + (exists ? ' exists' : ' does not exist'));
		});
	}
});
