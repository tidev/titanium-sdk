'use strict';

const path = require('path'),
	async = require('async'),
	utils = require('./utils'),
	copyFile = utils.copyFile,
	copyAndModifyFile = utils.copyAndModifyFile;

/**
 * @param {Object} options options object
 * @param {String} options.sdkVersion version of Titanium SDK
 * @param {String} options.gitHash SHA of Titanium SDK HEAD
 * @param {String} options.timestamp packaging timestamp in "%m/%d/%Y %H:%M" format
 */
function MobileWeb(options) {
	this.sdkVersion = options.sdkVersion;
	this.gitHash = options.gitHash;
	this.timestamp = options.timestamp;
}

MobileWeb.prototype.clean = function (next) {
	// no-op
	next();
};

MobileWeb.prototype.build = function (next) {
	// no-op
	next();
};

MobileWeb.prototype.package = function (packager, next) {
	console.log('Zipping MobileWeb platform...');
	// Mobileweb is already all in place. We should be careful to ignore folders/files that don't apply for OS
	async.series([
		// Copy all of mobileweb over...
		function (cb) {
			copyFile(packager.srcDir, packager.zipSDKDir, 'mobileweb', cb);
		},
		// then use substitutions on mobileweb/titanium/package.json
		function (cb) {
			const srcDir = path.join(packager.srcDir, 'mobileweb', 'titanium'),
				destDir = path.join(packager.zipSDKDir, 'mobileweb', 'titanium'),
				subs = {
					'__VERSION__': this.sdkVersion,
					'__TIMESTAMP__': packager.timestamp,
					'__GITHASH__': this.gitHash
				};
			copyAndModifyFile(srcDir, destDir, 'package.json', subs, cb);
		}.bind(this)
	], next);

};

module.exports = MobileWeb;
