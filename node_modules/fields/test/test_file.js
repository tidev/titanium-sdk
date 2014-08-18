var fields = require('../lib');

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
		console.log('you entered ' + value);
	}
});
