var exec = require('child_process').exec,
	os = require('os'),
	path = require('path'),
	async = require('async'),
	program = require('commander'),
	version = require('../package.json').version;

program
	.option('-v, --sdk-version [version]', 'Override the SDK version we report', process.env.PRODUCT_VERSION || version)
	.option('-t, --version-tag [tag]', 'Override the SDK version tag we report')
	.parse(process.argv);

var versionTag = program.versionTag || program.sdkVersion;

/**
 * @param  {String}   versionTag [description]
 * @param  {Function} next        [description]
 */
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

install(versionTag, function (err) {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	process.exit(0);
});
