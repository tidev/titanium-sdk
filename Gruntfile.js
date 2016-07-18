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
};
