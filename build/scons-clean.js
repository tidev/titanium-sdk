var async = require('async'),
	program = require('commander'),
	platforms = [],
	ALL_PLATFORMS = ['ios', 'android', 'mobileweb', 'windows'];

program
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
// TODO Replace 'ipad' or 'iphone' with 'ios'

async.each(platforms, function (item, next) {
	var Platform = require('./' + item);
	new Platform(program).clean(next);
}, function (err) {
	if (err) {
		process.exit(1);
	}
	process.exit(0);
});
