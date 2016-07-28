#!/usr/bin/env node

var exec = require('child_process').exec,
	os = require('os'),
	path = require('path'),
	async = require('async'),
	program = require('commander'),
	packageJSON = require('../package.json'),
	version = packageJSON.version,
	git = require('./git'),
	Packager = require('./packager'),
	platforms = [],
	oses = [],
	// TODO Move common constants somewhere?
	ROOT_DIR = path.join(__dirname, '..'),
	DIST_DIR = path.join(ROOT_DIR, 'dist'),
	ALL_OSES = ['win32', 'linux', 'osx'],
	ALL_PLATFORMS = ['ios', 'android', 'mobileweb', 'windows'],
	OS_TO_PLATFORMS = {
		'win32': ['android', 'mobileweb', 'windows'],
		'osx': ['android', 'ios', 'mobileweb'],
		'linux': ['android', 'mobileweb']
	};

program
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.option('-a, --api-level [number]', 'Explicitly set the Android SDK API level used for building')
	.option('-s, --android-sdk [path]', 'Explicitly set the path to the Android SDK used for building', process.env.ANDROID_SDK)
	.option('-n, --android-ndk [path]', 'Explicitly set the path to the Android NDK used for building', process.env.ANDROID_NDK)
	.parse(process.argv);

// We're building for the host OS
var thisOS = os.platform();
if ('darwin' === thisOS) {
	thisOS = 'osx';
}
oses.push(thisOS);

platforms = program.args;
if (!platforms.length) {
	platforms = OS_TO_PLATFORMS[thisOS];
}

function install(versionTag, next) {
	var zipfile,
		dest,
		osName = os.platform();

	if (osName === 'win32') {
		return next('Unable to unzip files on Windows currently. FIXME!');
	}

	if (osName === 'darwin') {
		osName = 'osx';
		dest = path.join(process.env.HOME, 'Library', 'Application Support', 'Titanium');
	}
	// TODO Where should we install on Windows?

	zipfile = path.join(__dirname, '..', 'dist', 'mobilesdk-' + versionTag + '-' + osName + '.zip');
	console.log('Installing %s...', zipfile);

	// TODO Combine with unzip method in packager.js?
	// TODO Support unzipping on windows
	exec('/usr/bin/unzip -q -o -d "' + dest + '" "' + zipfile + '"', function (err, stdout, stderr) {
		if (err) {
			return next(err);
		}
		return next();
	});
}

var versionTag = program.versionTag || program.sdkVersion;

async.series([
	function (next) {
		git.getHash(path.join(__dirname, '..'), function (err, hash) {
			program.githash = hash;
			console.log('Building MobileSDK version %s, githash %s', program.sdkVersion, program.githash);
			next(err);
		});
	}
], function (err) {
	if (err) {
		process.exit(1);
		return;
	}

	async.each(platforms, function (item, next) {
		var Platform = require('./' + item);
		new Platform(program).clean(next);
	}, function (err) {
		if (err) {
			process.exit(1);
		}

		async.eachSeries(platforms, function (item, next) {
			var Platform = require('./' + item);
			new Platform(program).build(next);
		}, function (err) {
			if (err) {
				process.exit(1);
			}
			// TODO Avoid zipping during packaging and just copy over to install it!
			async.eachSeries(oses, function (targetOS, next) {
				// Match our master platform list against OS_TO_PLATFORMS[item] listing.
				// Only package the platform if its in both arrays
				var filteredPlatforms = [];
				for (var i = 0; i < platforms.length; i++) {
					if (OS_TO_PLATFORMS[targetOS].indexOf(platforms[i]) != -1) {
						filteredPlatforms.push(platforms[i]);
					}
				}

				new Packager(DIST_DIR, targetOS, filteredPlatforms, program.sdkVersion, versionTag, packageJSON.moduleApiVersion, program.githash).package(next);
			}, function (err) {
				if (err) {
					console.error(err);
					process.exit(1);
				}
				console.log('Packaging version (%s) complete', versionTag);

				install(versionTag, function (err) {
					if (err) {
						console.error(err);
						process.exit(1);
					}
					process.exit(0);
				});
			});
		});
	});
});
