'use strict';

const async = require('async'),
	EXEC_LIMIT = 10;

module.exports = function (grunt) {

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

	// Project configuration.
	grunt.initConfig({
		eslint: {
			lintOnly: {
				src: [
					'dangerfile.js',
					'Gruntfile.js',
					'apidoc/**/*.js',
					'build/**/*.js',
					'cli/!(locales)/**/*.js',
					'common/**/*.js',
					'android/cli/!(locales)/**/*.js',
					'android/modules/**/src/js/**/*.js',
					'android/runtime/common/src/js/**/*.js',
					'iphone/cli/!(locales)/**/*.js',
					'tests/Resources/**/*test.js'
				],
			},
			fix: {
				src: '<%= eslint.lintOnly.src %>',
				options: {
					fix: true
				}
			}
		},
		clangFormat: {
			android: { src: androidSrc },
			ios: { src: iosSrc }
		},
		checkFormat: {
			android: { src: androidSrc },
			ios: { src: iosSrc }
		}
	});

	grunt.registerTask('validate:docs', 'Validates the docs.', function () {
		const done = this.async();
		const spawn = require('child_process').spawn, // eslint-disable-line security/detect-child-process
			path = require('path'),
			apidoc = path.join(__dirname, 'apidoc'),
			cmd = process.platform === 'win32' ? 'tdoc-validate.cmd' : 'tdoc-validate';

		const validate = spawn(path.join(__dirname, 'node_modules', '.bin', cmd), [ apidoc ], { silent: true });
		let output = '';

		validate.stderr.on('data', function (data) {
			output += data;
		});

		validate.on('close', function (code) {
			if (code !== 0) {
				done(new Error('Docs validation failed with exit code: ' + code + '\nOutput: ' + output));
			}
			done();
		});
	});

	function validateFormatting() {
		const done = this.async(),
			clangFormat = require('clang-format');

		// Iterate over all specified file groups.
		let src = [];
		this.files.forEach(function (f) {
			// Concat specified files.
			src = src.concat(f.src.filter(function (filepath) {
				// Warn on and remove invalid source files (if nonull was set).
				if (!grunt.file.exists(filepath)) {
					grunt.log.warn('Source file "' + filepath + '" not found.');
					return false;
				} else {
					return true;
				}
			}));
		});

		// Check format of the files in parallel, but limit number of simultaneous execs or we'll fail
		const errors = [];
		async.mapLimit(src, EXEC_LIMIT, function (filepath, cb) {
			let stdout = '';

			const proc = clangFormat.spawnClangFormat([ '-style=file', '-output-replacements-xml', filepath ], function () {}, 'pipe');
			proc.stdout.on('data', function (data) {
				stdout += data.toString();
			});
			proc.on('close', function (exit) {
				if (exit) {
					grunt.log.warn('Exit code: ' + exit);
					grunt.fail.fatal(stdout);
					cb(exit);
				}

				const modified = stdout.replace(/\r?\n/g, '');
				if (modified !== '<?xml version=\'1.0\'?><replacements xml:space=\'preserve\' incomplete_format=\'false\'></replacements>') {
					// Record failure, because formatting is bad.
					// TODO Get the correctly formatted source? Give more details on the bad sections?
					errors.push(new Error('Formatting incorrect on "' + filepath + '", proposed changes: ' + stdout));
				}
				// grunt.log.ok(filepath);
				cb();
			});
		}, function () {
			if (errors.length > 0) {
				grunt.fail.fatal(errors.join('\n'));
				return done(new Error(errors.join('\n')));
			}
			done();
		});
	}

	grunt.registerMultiTask('checkFormat', 'Validates the source code formatting.', validateFormatting);

	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-eslint');
	grunt.loadNpmTasks('grunt-clang-format');
	grunt.loadNpmTasks('grunt-contrib-clean');

	// linting: run eslint against js, check ios/android format via clang, run doc validation script
	grunt.registerTask('lint', [ 'eslint:lintOnly', 'checkFormat:ios', 'checkFormat:android', 'validate:docs' ]);

	// Tasks for formatting the source code according to our clang/eslint rules
	grunt.registerTask('format:js', [ 'eslint:fix' ]);
	grunt.registerTask('format:android', [ 'clangFormat:android' ]);
	grunt.registerTask('format:ios', [ 'clangFormat:ios' ]);
	grunt.registerTask('format', [ 'format:android', 'format:ios', 'format:js' ]);

	// By default, run linting
	grunt.registerTask('default', [ 'lint' ]);
};
