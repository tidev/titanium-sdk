var fields = require('../lib');

fields.setup({
//	colors: false
});

console.log('Object Test:\n');

fields.set({
	something: fields.text({
		promptLabel: 'Username',
		validate: function (value, callback) {
			callback(!value.length && new Error('Please enter a username'), value);
		}
	}),

	changePass: fields.select({
		promptLabel: 'Change password?',
		display: 'prompt',
		options: [ 'yes', 'no' ],
		next: function (err, value, callback) {
			if (value == 'no') {
				callback('favfood');
			} else {
				return null;
			}
		}
	}),

	password: fields.text({
		promptLabel: 'Enter a password',
		password: true,
		validate: function (value, callback) {
			callback(!value.length, value);
		}
	}),

	favfood: fields.text({
		promptLabel: 'What is your favorite food?'
	})
}).prompt(function (err, value) {
	if (err) {
		process.stdout.write('\n');
		console.error('Error occured! ', err);
		process.exit(0);
	} else {
		console.log('you entered:');
		console.log(value);
	}

	console.log('\nArray Test:\n');

	fields.set([
		fields.text({
			promptLabel: 'Username',
			validate: function (value, callback) {
				callback(!value.length, value);
			}
		}),

		fields.select({
			promptLabel: 'Change password?',
			display: 'prompt',
			options: [ 'yes', 'no' ],
			next: function (err, value, callback) {
				if (value == 'no') {
					callback(3);
				} else {
					return null;
				}
			}
		}),

		fields.text({
			promptLabel: 'Enter a password',
			password: true,
			validate: function (value, callback) {
				callback(!value.length, value);
			}
		}),

		fields.text({
			promptLabel: 'What is your favorite food?'
		})
	]).prompt(function (err, value) {
		if (err) {
			process.stdout.write('\n');
			process.exit(0);
		} else {
			console.log('you entered:');
			console.log(value);
		}
	});

});
