var commander = require('commander'),
	version = require('../package.json').version;

commander
	.version(version)
	.command('clean [platforms]', 'clean up build directories for one or more platforms')
	.command('install', 'install the built SDK')
	.command('package [platforms]', 'package one or more platforms')
	.command('build [platforms]', 'build one or more platforms')
	.parse(process.argv);
