var fields = require('../lib');

var set = fields.set({
	text: fields.text({
		title: 'Enter something',
		desc: 'It can be anything really',
		default: 'Chris Barber',
		validate: function (value, callback) {
			callback(!value.length, value);
		}
	}),
	password: fields.text({
		title: 'Enter a password',
		index: 1,
		password: true,
		validate: function (value, callback) {
			!value && console.error('you must enter a password');
			callback(!value, value);
		}
	})
});

set.prompt(function (err, value) {
	if (err) {
		process.stdout.write('\n');
		process.exit(0);
	} else {
		console.log('you entered', value);
	}
});
