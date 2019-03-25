'use strict';

const copyFile = require('./utils').copyFile;

class Windows {
	/**
	 * @param {Object} options options object
	 * @param {String} options.sdkVersion version of Titanium SDK
	 * @param {String} options.gitHash SHA of Titanium SDK HEAD
	 */
	constructor (options) {
		this.sdkVersion = options.sdkVersion;
		this.gitHash = options.gitHash;
	}

	async clean() {
		// no-op
	}

	async build () {
		// TODO Pull the zipfile down and extract it?
	}

	async package(packager) {
		console.log('Zipping Windows platform...');
		// Windows is already all in place. We should be careful to ignore folders/files that don't apply for OS
		return copyFile(packager.srcDir, packager.zipSDKDir, 'windows');
	}
}

module.exports = Windows;
