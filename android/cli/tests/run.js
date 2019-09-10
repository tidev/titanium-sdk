/**
 * Bootstraps mocha and handles code coverage testing setup.
 *
 * @copyright
 * Copyright (c) 2009-2017 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

var fs = require('fs'),
	path = require('path'),
	colors = require('colors'),
	should = require('should'), // eslint-disable-line no-unused-vars
	Mocha = require('mocha/lib/mocha.js'),
	Base = require('mocha/lib/reporters/base'),
	mocha = new Mocha(),
	optimist = require('optimist'),
	reporter = 'spec';

optimist
	.option('h', {
		alias: 'help',
		boolean: true,
		desc: 'shows this help screen'
	})
	.options('c', {
		alias: 'conf <file>',
		string: true,
		desc: 'path to a json file containing test settings'
	})
	.options('no-colors', {
		boolean: true,
		default: true,
		desc: 'disables colors'
	});

if (Object.prototype.hasOwnProperty.call(optimist.argv, 'colors') && !optimist.argv.colors) {
	Base.useColors = false;
	colors.mode = 'none';
}

if (!process.env.APPC_COV) {
	console.log('Unit Test Tool'.cyan.bold + ' - Copyright (c) 2012-' + (new Date()).getFullYear() + ', Appcelerator, Inc.  All Rights Reserved.');
}

// display the help, if needed
if (optimist.argv.help || optimist.argv.h) {
	console.log('\nUsage: ' + 'forge test [<test-suite>] [options]'.cyan + '\n');
	console.log(optimist.help());
	process.exit(0);
}

// load the config, if specified
global.conf = {};
let confFile = optimist.argv.conf || optimist.argv.c;
if (confFile) {
	if (!fs.existsSync(confFile = path.resolve(confFile))) {
		console.error(('\nERROR: Config file "' + confFile + '" does not exist').red + '\n');
		process.exit(1);
	}

	try {
		global.conf = JSON.parse(fs.readFileSync(confFile));
	} catch (ex) {
		console.error(('\nERROR: Unable to parse config file "' + confFile).red + '"\n');
		process.exit(1);
	}
}

global.__lib = function (file) {
	return path.join(__dirname, '..', 'lib', file);
};

// if we're running coverage testing, then we need to use our custom reporter
if (process.env.APPC_COV) {
	global.__lib = function (file) {
		return path.join(__dirname, '..', 'lib-cov', file);
	};

	reporter = function (runner) {
		var jade = require('jade'),
			JSONCov = require(path.join(__dirname, '../node_modules/mocha/lib/reporters/json-cov')), // eslint-disable-line security/detect-non-literal-require
			file = path.join(fs.existsSync(process.env.APPC_COV) ? process.env.APPC_COV : path.join(__dirname, 'templates'), 'coverage.jade'),
			fn = jade.compile(fs.readFileSync(file), { filename: file }),
			packageJson = require('../package.json'),
			self = this;

		JSONCov.call(this, runner, false);

		runner.on('end', function () {
			process.stdout.write(fn({
				title: packageJson.name + ' Code Coverage',
				version: packageJson.version,
				cov: self.cov,
				coverageClass: function (n) {
					if (n >= 75) {
						return 'high';
					}
					if (n >= 50) {
						return 'medium';
					}
					if (n >= 25) {
						return 'low';
					}
					return 'terrible';
				}
			}));
		});
	};
}

// most of the logic below is the same as what the standalone mocha process does
Error.stackTraceLimit = Infinity;

mocha.reporter(reporter);
mocha.ui('bdd');
mocha.globals([ 'conf', 'should' ]);
mocha.checkLeaks();
mocha.suite.slow('1s');

const runTest = optimist.argv._.shift();
if (runTest) {
	// running a single test
	mocha.files = [ path.join(__dirname, 'test-' + runTest + '.js') ];
	if (!fs.existsSync(mocha.files[0])) {
		console.error(('\nERROR: Invalid test "' + runTest + '"\n').red);
		process.exit(1);
	}
} else {
	// running all tests
	mocha.files = (function walk(dir) {
		var ff = [];
		fs.readdirSync(dir).forEach(function (name) {
			var file = path.join(dir, name);
			if (!fs.existsSync(file)) {
				return;
			}
			if (fs.statSync(file).isDirectory()) {
				ff = ff.concat(walk(file));
			} else if ((runTest && name == runTest) || (!runTest && /^test-.+\.js$/.test(name))) { // eslint-disable-line eqeqeq
				ff.push(file);
			}
		});
		return ff;
	}(__dirname));
}

// run the tests
mocha.run(function (err) {
	// if doing coverage tests, we don't care about failures
	process.exit(process.env.APPC_COV || !err ? 0 : 1);
});
