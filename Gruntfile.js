module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		appcJs: {
			src: ['apidoc/**/*.js', '!apidoc/node_modules/**']
		},
		clangFormat: {
			src: [] // unused ATM
		}
	});

	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-appc-js');
	grunt.loadNpmTasks('grunt-clang-format');
	grunt.loadNpmTasks('grunt-contrib-clean');

	// register tasks
	grunt.registerTask('lint', ['appcJs']);

	// register tasks
	grunt.registerTask('format', ['clangFormat']);

	// register tasks
	grunt.registerTask('default', ['lint']);

	// update npm deps task
	grunt.registerTask('update-npm-deps', 'Updated NPM dependencies', function () {
		var done = this.async(),
			exec = require('child_process').exec,
			fs = require('fs'),
			path = require('path');

		if (parseInt(process.versions.modules) < 45) {
			return done(new Error('You must run this using io.js 3.0. Sorry.'));
		}

		grunt.log.writeln('Removing old Node modules');

		function rm(dir, ignore) {
			fs.existsSync(dir) && fs.readdirSync(dir).forEach(function (name) {
				var file = path.join(dir, name);

				if (ignore && ignore.indexOf(name) !== -1) {
					grunt.log.writeln('Skipping ' + name);
					return;
				} else if (ignore) {
					grunt.log.writeln('Removing ' + name);
				}

				if (fs.existsSync(file) && fs.statSync(file).isDirectory() && (!ignore || ignore.indexOf(name) === -1)) {
					rm(file);
					fs.rmdirSync(file);
				} else {
					fs.unlinkSync(file);
				}
			});
		}

		rm(path.join(__dirname, 'node_modules'), ['titanium-sdk']);

		grunt.log.writeln('Running npm install');
		exec('npm install', function (err, stdout, stderr) {
			if (err) {
				return done(err);
			}

			grunt.log.writeln('Building node-ios-device binaries');
			exec('make', { cwd: path.join(__dirname, 'node_modules', 'ioslib', 'node_modules', 'node-ios-device') }, function (err, stdout, stderr) {
				rm(path.join(__dirname, 'node_modules', 'ioslib', 'node_modules', 'node-ios-device', 'build'));
				done(err);
			});
		});
	});
};
