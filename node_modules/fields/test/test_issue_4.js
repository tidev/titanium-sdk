var fields = require('../lib');

fields.select({
	promptLabel: 'Try to pick "bar" by number',
	display: 'list',
	numbered: true,
	options: [ 'foo', 'foo', 'bar' ]
}).prompt(function (err, value) {
	console.log('You selected ' + value);
});