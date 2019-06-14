'use strict';

const promisify = require('util').promisify;
const exec = promisify(require('child_process').exec); // eslint-disable-line security/detect-child-process

/**
 * Get the short (7-character) SHA hash of HEAD in the supplied workig directory.
 * @param {string} cwd current working directory path
 * @returns {Promise<string>} sha of current git commit for HEAD
 */
async function getHash(cwd) {
	const { stdout } = await exec('git rev-parse --short --no-color HEAD', { cwd: cwd });
	return stdout.trim(); // drop leading 'commit ', just take 7-character sha
}

module.exports = { getHash };
