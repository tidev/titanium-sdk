module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		appcJs: {
			src: ['Gruntfile.js', 'apidoc/**/*.js', '!apidoc/node_modules/**']
		},
        clangFormat: {
            src: [] // unused ATM
        },
		version: {
			patchTitaniumVersion: {
				options: {
					prefix: '^version\\s+=\\s+[\'"]'
				},
				src: ['build/titanium_version.py']
			},
			patchPackage: {
				src: ['package.json']
			}
		}
	});

	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-appc-js');
	grunt.loadNpmTasks('grunt-clang-format');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-version');

	// register tasks
	grunt.registerTask('lint', ['appcJs']);

	// register tasks
	grunt.registerTask('format', ['clangFormat']);

	// register tasks
	grunt.registerTask('bump', ['version::patch']);
	grunt.registerTask('bump:major', ['version::major']);
	grunt.registerTask('bump:minor', ['version::minor']);
	grunt.registerTask('bump:patch', ['version::patch']);

	// register tasks
	grunt.registerTask('default', ['lint']);
};
