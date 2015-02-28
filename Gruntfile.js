module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		jshint: {
			options: {
				jshintrc: true
			},
			src: ['Gruntfile.js']
		},
		jscs: {
            options: {
                config: '.jscsrc',
                reporter: 'inline'

            },
			src: ['Gruntfile.js']
		}
	});

	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-jscs');
	grunt.loadNpmTasks('grunt-contrib-clean');

	// register tasks
	grunt.registerTask('default', ['jshint', 'jscs']);
};
