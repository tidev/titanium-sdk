var path = require('path'),
	async = require('async'),
	program = require('commander'),
	version = require('../package.json').version,
	git = require('./git'),
	platforms = [],
	ALL_PLATFORMS = ['ios', 'android', 'mobileweb', 'windows'];

program
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-a, --api-level [number]', 'Explicitly set the Android SDK API level used for building')
	.option('-s, --android-sdk [path]', 'Explicitly set the path to the Android SDK used for building', process.env.ANDROID_SDK)
	.option('-n, --android-ndk [path]', 'Explicitly set the path to the Android NDK used for building', process.env.ANDROID_NDK)
	.parse(process.argv);

platforms = program.args;

if (!platforms.length) {
	// assume all!
	platforms = ['full'];
}

// expand 'full' to every platform
if (platforms.length === 1 && platforms[0] == 'full') {
	platforms = ALL_PLATFORMS;
}

// TODO Allow iphone/ipad alias for ios!

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

	// TODO Run in parallel? Output will get messy, but no reason we couldn't grab ios prereqs while Android compiles
	async.eachSeries(platforms, function (item, next) {
		var Platform = require('./' + item);
		new Platform(program).build(next);
	}, function (err) {
		if (err) {
			process.exit(1);
		}
		process.exit(0);
	});
});
