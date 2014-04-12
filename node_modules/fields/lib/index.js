var fs = require('fs'),
	path = require('path'),
	colors = require('colors'),
	common = require('./common'),
	defaults = {
		colors: true,
		separator: ': ',
		defaultLeft: '[',
		defaultRight: ']',
		promptValuesLeft: '(',
		promptValuesSeparator: '|',
		promptValuesRight: ')',
		mask: '*',
		fieldSeparator: '\n',
		style: {
			default: 'cyan',
			input: 'magenta',
			title: 'bold',
			promptLabel: 'bold',
			promptValues: null,
			desc: 'grey',
			mask: 'magenta',
			group: 'grey',
			error: 'red',
			suggestion: 'cyan',
			option: 'cyan',
			accelerator: ['underline', 'bold', 'cyan']
		}
	};

['File', 'Select', 'Text'].forEach(function (name) {
	var m = exports[name] = require('./types/' + name.toLowerCase());
	Object.defineProperty(m.prototype, '_defaults', { value: defaults });
	exports[name.toLowerCase()] = function createField(opts) { return new m(opts); };
});

exports.Set = require('./types/set');
Object.defineProperty(exports.Set.prototype, '_defaults', { value: defaults });
exports.set = function createSet(fields, opts) { return new exports.Set(fields, opts); };

exports.setup = function setup(opts) {
	common.mix(defaults, opts);
	colors.mode = defaults.colors ? 'console' : 'none';
	return exports;
};
