module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		appcJs: {
			src: ['Gruntfile.js', 'apidoc/**/*.js', '!apidoc/node_modules/**']
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
	grunt.registerTask('updateDeps', 'Updated NPM dependencies', function () {
		var done = this.async(),
			exec = require('child_process').exec,
			fs = require('fs'),
			path = require('path');

		if (parseInt(process.versions.modules) < 45) {
			return done(new Error('You must run this using io.js 3.0'));
		}

		(function rm(dir, ignore) {
			fs.existsSync(dir) && fs.readdirSync(dir).forEach(function (name) {
				var file = path.join(dir, name);
				if (fs.existsSync(file) && fs.statSync(file).isDirectory() && (!ignore || ignore.indexOf(name) === -1)) {
					rm(dir);
				} else {
					fs.unlinkSync(file);
				}
			});
		}(path.join(__dirname, 'node_modules'), ['sqlite3', 'titanium-sdk']));

		exec('npm install', function (err, stdout, stderr) {
			if (err) {
				return done(err);
			}

			exec('make', { cwd: path.join(__dirname, 'node_modules', 'ioslib', 'node_modules', 'node-ios-device') }, function (err, stdout, stderr) {
				done(err);
			});
		});
	});
};
