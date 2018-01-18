'use strict';

const exec = require('child_process').exec, // eslint-disable-line security/detect-child-process
	Git = {};
/**
 * Get the short (7-character) SHA hash of HEAD in the supplied workig directory.
 * @param {string} cwd current working directory path
 * @param {Function} next callback function
 */
Git.getHash = function (cwd, next) {
	exec('git rev-parse --short --no-color HEAD', { cwd: cwd }, function (error, stdout) {
		if (error) {
			return next('Failed to get Git HASH: ' + error);
		}

		next(null, stdout.trim()); // drop leading 'commit ', just take 7-character sha
	});
};

module.exports = Git;
