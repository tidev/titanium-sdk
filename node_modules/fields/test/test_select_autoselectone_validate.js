var fields = require('../lib'),
	worked = false;

fields.select({
	autoSelectOne: true,
	promptLabel: 'Select by id or name',
	options: [
		{ label: 'foo', value: 123 }
	],
	validate: function (value, callback) {
		worked = true;
		callback(null, value);
	}
}).prompt(function (err, value) {
	if (err) {
		console.log('Got error', err);
	} else if (worked) {
		console.log('It works!');
	} else {
		console.log('Custom validate() not called!');
	}

	fields.select({
		autoSelectOne: true,
		promptLabel: 'Select by id or name',
		options: [
			{ label: 'foo', value: 123 }
		],
		validate: function (value, callback) {
			callback(new Error('foo'));
		}
	}).prompt(function (err, value) {
		if (err) {
			console.log('It works!', err);
		} else {
			console.log('Failed, expected an error');
		}

		fields.select({
			autoSelectOne: true,
			promptLabel: 'Select by id or name',
			options: [
				{ label: 'foo', value: 123 }
			],
			validate: function (value, callback) {
				return true;
			}
		}).prompt(function (err, value) {
			if (err) {
				console.log('Got error', err);
			} else {
				console.log('It works!');
			}

			fields.select({
				autoSelectOne: true,
				promptLabel: 'Select by id or name',
				options: [
					{ label: 'foo', value: 123 }
				],
				validate: function (value, callback) {
					return false;
				}
			}).prompt(function (err, value) {
				if (err) {
					console.log('It works!', err);
				} else {
					console.log('Failed, expected an error');
				}
			});

		});

	});

});
