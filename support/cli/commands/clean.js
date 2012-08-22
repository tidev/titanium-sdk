/*
 * build.js: Titanium Mobile Web CLI build command
 *
 * Copyright (c) 2012, Appcelerator, Inc.  All Rights Reserved.
 * See the LICENSE file for more information.
 */

var appc = require('node-appc'),
	fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	manifest = appc.manifest(module),
	platformAliases = {
		'ipad': 'iphone',
		'ios': 'iphone'
	},
	projectDir;

exports.config = function (logger, config, cli) {
	return {
		desc: __('creates a new mobile application or module'),
		options: {
			platform: {
				abbr: 'p',
				desc: __('a platform to clean'),
				values: manifest.platforms
			},
			user: {
				desc: __('user to log in as, if not already logged in')
			},
			password: {
				desc: __('the password to log in with')
			},
			'log-level': {
				callback: function (value) {
					logger.levels[value] && logger.setLevel(value);
				},
				desc: __('minimum logging level'),
				default: 'warn',
				values: Object.keys(logger.levels)
			}
		},
		args: [
			{
				desc: __('the directory containing the project, otherwise the current working directory'),
				name: 'project-dir'
			}
		]
	};
};

exports.validate = function (logger, config, cli) {
	var platform = platformAliases[cli.argv.platform] || cli.argv.platform;
	if (platform && manifest.platforms.indexOf(platform) == -1) {
		logger.error(__('Invalid platform "%s"', cli.argv.platform) + '\n');
		
		var suggestions = manifest.platforms.filter(function (p) {
			if (p.indexOf(platform) == 0 || appc.string.levenshtein(platform, p) <= 3) {
				return p;
			}
		});
		
		if (suggestions.length) {
			logger.log(__('Did you mean this?'));
			suggestions.forEach(function (s) {
				logger.log('    ' + s.cyan);
			});
			logger.log();
		}
		
		logger.log(__('Available platforms are: %s', manifest.platforms.join(', ').cyan) + '\n');
		
		process.exit(1);
	}
	
	if (cli.argv._.length == 0) {
		projectDir = process.cwd();
	} else {
		projectDir = appc.fs.resolvePath(cli.argv._[0]);
	}
	
	if (!appc.fs.exists(projectDir)) {
		logger.error(__('Project directory does not exist') + '\n');
		process.exit(1);
	}
	
	var dir = projectDir,
		tiapp = path.join(dir, 'tiapp.xml');
	while (!appc.fs.exists(tiapp) && dir != '/') {
		dir = path.dirname(dir);
		tiapp = path.join(dir, 'tiapp.xml');
	}
	
	if (dir == '/') {
		logger.error(__('Invalid project directory "%s"', projectDir) + '\n');
		process.exit(1);
	} else {
		projectDir = dir;
	}
};

exports.run = function (logger, config, cli) {
	var buildDir = path.join(projectDir, 'build');
	
	appc.fs.touch(path.join(projectDir, 'tiapp.xml'));
	
	if (cli.argv.platform) {
		var dir = path.join(buildDir, cli.argv.platform);
		appc.fs.exists(dir) && wrench.rmdirSyncRecursive(dir);
	} else {
		fs.readdirSync(buildDir).forEach(function (dir) {
			dir = path.join(buildDir, dir);
			if (fs.lstatSync(dir).isDirectory()) {
				wrench.rmdirSyncRecursive(dir);
			}
		});
	}
	
	logger.log(__('Project cleaned successfully in %s', appc.time.printDiff(cli.startTime, Date.now())) + '\n');
};

/*
def clean_build(project_dir,platform):
	project_build_dir = os.path.join(project_dir,'build',platform)
	for root, dirs, files in os.walk(project_build_dir, topdown=False):
		for name in files:
			os.remove(os.path.join(root, name))
		for name in dirs:
			os.rmdir(os.path.join(root, name))

def clean_platform(project_dir,platform):
	if platform == 'android':
		clean_build(project_dir,'android')
	elif is_ios(platform):
		clean_build(project_dir,'iphone')
	elif platform == 'mobileweb':
		clean_build(project_dir,'mobileweb')

def clean(args):
	project_dir = get_required(args,'dir')
	tiapp_xml = os.path.join(project_dir,'tiapp.xml')
	touch_tiapp_xml(tiapp_xml)
	
	platform = get_optional(args,'platform')
	if type(platform) == types.NoneType:
		clean_build(project_dir,'android')
		clean_build(project_dir,'iphone')
		clean_build(project_dir,'mobileweb')
	elif type(platform) == types.ListType:
		for osname in platform:
			clean_platform(project_dir,osname)
	else:
		clean_platform(project_dir,platform)
*/