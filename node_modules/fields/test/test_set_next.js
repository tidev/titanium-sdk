var fields = require('../lib');

fields.setup({
//	colors: false
});

fields.set({
	username: fields.text({
		promptLabel: 'Username',
		validate: function (value, callback) {
			callback(!value.length && new Error('Please enter a username'), value);
		}
	}),

	password: fields.text({
		title: 'Enter "123123" to login, otherwise you\'ll have to enter your username again',
		promptLabel: 'Password',
		validate: function (value, callback) {
			if (!value.length) {
				callback(new Error('Please enter a password'));
			} else {
				// try logging in
				if (value != '123123') {
					console.log('bad password');
					callback(true);
				} else {
					// success
					callback(null, value);
				}
			}
		},
		next: function (err, value, callback) {
			return err ? 'username' : null;
		},
		repromptOnError: false
	})
}, { stopOnError: false }).prompt(function (err, value) {
	if (err) {
		process.stdout.write('\n');
		console.error('Error occured! ', err);
		process.exit(0);
	} else {
		console.log('you entered:');
		console.log(value);
	}
});
