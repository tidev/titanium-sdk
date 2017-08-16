'use strict';

module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		appcJs: {
			src: [ 'Gruntfile.js', 'apidoc/**/*.js', 'build/**/*.js', 'cli/!(locales)/**/*.js', 'android/cli/!(locales)/**/*.js', 'iphone/cli/!(locales)/**/*.js' ]
		},
		clangFormat: {
			src: [] // unused ATM
		}
	});

	grunt.registerTask('validate_docs', 'Validates the docs.', function () {
		const done = this.async();
		const fork = require('child_process').fork, // eslint-disable-line security/detect-child-process
			path = require('path'),
			apidoc = path.join(__dirname, 'apidoc');

		const validate = fork(path.join(apidoc, 'validate'), [], { cwd: apidoc, silent: true });
		let output = '';
		validate.stdout.on('data', function (data) {
			output += data;
		});

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

	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-appc-js');
	grunt.loadNpmTasks('grunt-clang-format');
	grunt.loadNpmTasks('grunt-contrib-clean');

	// register tasks
	grunt.registerTask('lint', [ 'appcJs', 'validate_docs' ]);

	// register tasks
	grunt.registerTask('format', [ 'clangFormat' ]);

	// register tasks
	grunt.registerTask('default', [ 'lint' ]);
};
