var os = require('os'),
	path = require('path'),
	async = require('async'),
	program = require('commander'),
	packageJSON = require('../package.json'),
	version = packageJSON.version,
	Documentation = require('./docs'),
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
	.option('-a, --all', 'Build a zipfile for every OS')
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.parse(process.argv);

platforms = program.args;

var thisOS = os.platform();
if ('darwin' === thisOS) {
	thisOS = 'osx';
}
oses.push(thisOS);
if (program.all) {
	oses = ALL_OSES;
}

// If user doesn't specify platforms, assume default list by OS
if (!platforms.length) {
	platforms = OS_TO_PLATFORMS[thisOS];
}

var versionTag = program.versionTag || program.sdkVersion;

git.getHash(path.join(__dirname, '..'), function (err, hash) {
	var outputDir = DIST_DIR;
	console.log('Packaging MobileSDK (%s)...', versionTag);

	new Documentation(outputDir).generate(function (err) {
		// Now package for each OS.
		// MUST RUN IN SERIES - this all runs in same directory, so running in
		// parallel for each OS would cause all sorts of collisions right now.
		// TODO Separate out working directories per-OS so we can do in parallel!
		async.eachSeries(oses, function (item, next) {
			// FIXME filter against OS_TO_PLATFORMS! If program.all is true, add 'ios' to list for linux OS
			new Packager(outputDir, item, platforms, program.sdkVersion, versionTag, packageJSON.moduleApiVersion, hash).package(next);
		}, function (err) {
			if (err) {
				console.error(err);
				process.exit(1);
			}
			console.log('Packaging version (%s) complete', versionTag);
			process.exit(0);
		});
	});
});
