var colors = require('colors'),
	fields = require('../lib');

/*

The goal here is to:
 - select fruit by `id`
 - select fruit by `name`
 - be able to tab complete the `name` or `id`
 - hit enter to accept default which is the `name`
 - the final value must be the `id`

*/

fields.select({
	title: 'Select a fruit by number or name',
	formatters: {
		option: function (opt, idx, num) {
			return opt.id + ')  ' + opt.name.cyan;
		}
	},
	complete: true,
	numbered: false,
	relistOnError: true,
	complete: ['id', 'name'],
	completeIgnoreCase: true,
	suggest: true,
	default: 'Apple',
	promptLabel: 'Select by id or name',
	optionLabel: 'name',
	optionValue: 'id',
	options: [
		{ id: 0, name: 'Apple' },
		{ id: 1, name: 'Orange' },
		{ id: 2, name: 'Banana' },
		{ id: 3, name: 'Peach' },
		{ id: 4, name: 'Strawberry' },
		{ id: 5, name: 'Lemon' },
		{ id: 6, name: 'Grape' },
		{ id: 7, name: 'Cherry' },
		{ id: 8, name: 'Pear' },
		{ id: 9, name: 'Pineapple' },
		{ id: 10, name: 'Coconut' },
		{ id: 11, name: 'Kiwi' },
		{ id: 12, name: 'Watermelon' },
		{ id: 13, name: 'Lime' },
		{ id: 14, name: 'Cantaloupe' },
		{ id: 15, name: 'Raspberry' }
	]
}).prompt(function (err, value) {
	if (err) {
		process.stdout.write('\n');
		process.exit(0);
	} else {
		console.log('you selected ' + value);
	}
});
