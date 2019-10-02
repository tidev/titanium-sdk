#!/usr/bin/env node
'use strict';

const async = require('async');
const clangFormat = require('clang-format');
const promisify = require('util').promisify;
const glob = promisify(require('glob'));
const path = require('path');
const program = require('commander');
const EXEC_LIMIT = 10;

const ROOT = path.join(__dirname, '..');

const iosSrc = [
	'iphone/Classes/*.h',
	'iphone/Classes/*.m',
	'iphone/Classes/Layout/*.h',
	'iphone/Classes/Layout/*.m',
	'iphone/TitaniumKit/TitaniumKit/*.h',
	'iphone/TitaniumKit/TitaniumKit/Sources/**/*.h',
	'iphone/TitaniumKit/TitaniumKit/Sources/**/*.m'
];

const androidSrc = [
	'android/build/src/**/*.java',
	'android/kroll-apt/src/**/*.java',
	'android/modules/*/src/**/*.java',
	'android/runtime/*/src/**/*.java',
	'android/titanium/src/**/*.java'
];

program.option('--android', 'Run format on Android')
	.option('--fix', 'Fix files automatically', false)
	.option('-e, --exec-limit [limit]', 'Max number of processes to run in parallel', EXEC_LIMIT)
	.option('--ios', 'Run format on iOS')
	.parse(process.argv);

async function main(program) {

	const files = [];
	const errors = [];

	if (program.android) {
		for (const globs of androidSrc) {
			files.push(... await glob(globs, { cwd: ROOT }));
		}
	}

	if (program.ios) {
		for (const globs of iosSrc) {
			files.push(... await glob(globs, { cwd: ROOT }));
		}
	}

	return new Promise((resolve, reject) => {
		async.mapLimit(files, program.execLimit, function (filepath, cb) {
			filepath = path.resolve(ROOT, filepath);
			let stdout = '';

			const proc = clangFormat.spawnClangFormat([ '-style=file', '-output-replacements-xml', filepath ], function () {}, 'pipe');
			proc.stdout.on('data', function (data) {
				stdout += data.toString();
			});
			proc.on('close', function (exit) {
				if (exit) {
					console.warn('Exit code: ' + exit);
					return cb();
				}

				const modified = stdout.replace(/\r?\n/g, '');
				if (modified !== '<?xml version=\'1.0\'?><replacements xml:space=\'preserve\' incomplete_format=\'false\'></replacements>') {
					// Record failure, because formatting is bad.
					// TODO Get the correctly formatted source? Give more details on the bad sections?
					errors.push(new Error('Formatting incorrect on "' + filepath + '", proposed changes: ' + stdout));
				}
				cb();
			});
		}, function () {
			if (errors.length > 0) {
				const error = new Error(errors.join('\n'));
				error.code = 'ELINTFAILURE';
				return reject(error);
			}
			return resolve();
		});
	});

}

main(program)
	.then(() => process.exit(0))
	.catch(err => {
		// If there's lint errors, just log the message to the console, otherwise it's a script error and we want the stack
		if (err.code === 'ELINTFAILURE') {
			console.log(err.message);
		} else {
			console.log(err);
		}
		process.exit(1);
	});
