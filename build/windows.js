'use strict';

const copyFile = require('./utils').copyFile;

/**
 * @param {Object} options options object
 * @param {String} options.sdkVersion version of Titanium SDK
 * @param {String} options.gitHash SHA of Titanium SDK HEAD
 */
function Windows(options) {
	this.sdkVersion = options.sdkVersion;
	this.gitHash = options.gitHash;
}

Windows.prototype.clean = function (next) {
	// no-op
	next();
};

Windows.prototype.build = function (next) {
	// TODO Pull the zipfile down and extract it?
	next();
};

Windows.prototype.package = function (packager, next) {
	console.log('Zipping Windows platform...');
	// Windows is already all in place. We should be careful to ignore folders/files that don't apply for OS
	copyFile(packager.srcDir, packager.zipSDKDir, 'windows', next);

};

module.exports = Windows;
