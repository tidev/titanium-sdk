var fields = require('../lib');

fields.select({
	promptLabel: 'Please press "2"',
	display: 'list',
	numbered: true,
	options: [ 'foo', 'foo', 'bar' ]
}).prompt(function (err, value) {
	if (err) {
		console.error(err);
	} else if (value === 'foo') {
		console.log('It works!');
	} else {
		console.log('Failed: expected "' + value + '" to equal "foo"');
	}
	console.log();
});