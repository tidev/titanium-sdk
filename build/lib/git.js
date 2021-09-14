'use strict';

const promisify = require('util').promisify;
const exec = promisify(require('child_process').exec); // eslint-disable-line security/detect-child-process

/**
 * Get the short (10-character) SHA hash of HEAD in the supplied working directory.
 * @param {string} cwd current working directory path
 * @returns {Promise<string>} sha of current git commit for HEAD
 */
async function getHash(cwd) {
	const { stdout } = await exec('git rev-parse --short=10 --no-color HEAD', { cwd });
	return stdout.trim(); // drop leading 'commit ', just take 10-character sha
}

/**
 * Discards a local Git change.
 * @param {string} cwd current working directory path
 * @param {string} file the file to discard
 * @returns {Promise<string>} sha of current git commit for HEAD
 */
function discardLocalChange(cwd, file) {
	return exec(`git checkout -- ${file}`, { cwd });
}

module.exports = { getHash, discardLocalChange };
