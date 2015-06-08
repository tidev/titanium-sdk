var fields = require('../lib');

fields.setup({
});

var yesno = fields.select({
	promptLabel: 'Do it?',
	display: 'prompt',
	default: 'yes',
	options: [ 'yes', 'no' ]
});

var milkshakes = fields.select({
	title: 'What is your favorite milkshake?',
	options: [
		'__v__anilla',
		'st__r__awberry',
		'cho__c__olate'
	],
	complete: true,
	ignoreCase: true,
	suggest: true,
	suggestThreshold: 3
});

var autoselect = fields.select({
	title: 'This should not be prompted for because there is only one option',
	options: [
		'foo',
	],
	autoSelectOne: true
})

var actest = fields.select({
	title: 'Auto-complete test',
	desc: 'Just type "he" and hit tab',
	options: [
		'hello',
		'hellothere',
		'helloworld'
	],
	complete: true,
	suggest: true,
	suggestThreshold: 3
});

var colors = fields.select({
	title: 'Choose your favorite color',
	desc: 'It can be any of these colors',
	options: [
		{ label: 'red'.red + '    #f00', value: 'red' },
		{ label: 'green'.green + '  #0f0', value: 'green' },
		{ label: 'blue'.blue + '   #00f', value: 'blue' }
	],
	relistOnError: true
});

var ppuuid = fields.select({
	title: 'Select a UUID by number or name',
	formatters: {
		option: function (opt, idx, num) {
			return num + opt.value.cyan + '  ' + opt.name;
		}
	},
	numbered: true,
	relistOnError: true,
	complete: true,
	suggest: true,
	options: {
		'Available UUIDs:': [
			{ name: 'uuid 1', value: '43C5E7DE-F6BB-4AEF-98F0-0A33990EA280' },
			{ name: 'uuid 2', value: '4F562E96-C933-4367-B6BD-89CA7D6EE400' },
			{ name: 'uuid 3', value: '31D3AC10-99F4-43E1-997B-980E70EC706B' },
			{ name: 'uuid 4', value: 'E1512AE0-FEBB-43A2-9C9C-E1D2F4D6C51F' },
			{ name: 'uuid 5', value: 'F624D6BA-5FF3-4E48-B9F2-BC7DD1A8EA97' },
			{ name: 'uuid 6', value: '3C12C8D9-C05F-4834-BA7E-9C55CB8C9287' },
			{ name: 'uuid 7', value: 'BB91EDBF-2A97-4227-B5B2-5943BAB30304' },
			{ name: 'uuid 8', value: '204C6E4A-FA9C-48BB-9D84-709A10A690AB' },
			{ name: 'uuid 9', value: '05282F35-42BB-40F3-8C20-3EC1739AB414' },
			{ name: 'uuid 10', value: '5EC586D9-7E2B-4F55-834D-CD8199DD92B8' },
			{ name: 'uuid 11', value: 'A4BD1980-8C4B-4DBB-8FBE-5A52E36DFA63' },
			{ name: 'uuid 12', value: '99C49052-E280-48D3-B881-E8112B7DFCF1' },
			{ name: 'uuid 13', value: 'A057301B-B38D-40B6-A6A4-B582AE5EAABE' },
			{ name: 'uuid 14', value: 'D39B019B-3EF0-4BCA-A1E9-FC2F5063097F' },
			{ name: 'uuid 15', value: 'C9A11E0C-5FF4-4B55-890F-F7715194CAB3' },
			{ name: 'uuid 16', value: 'B1E31DD0-8968-4A32-B210-A0558302F65B' }
		]
	}
});

fields.set([
	yesno,
	milkshakes,
	autoselect,
	actest,
	colors,
	ppuuid
]).prompt(function (err, value) {
	if (err) {
		process.stdout.write('\n');
		process.exit(0);
	} else {
		console.log('you entered ' + value);
	}
});
