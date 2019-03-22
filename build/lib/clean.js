'use strict';

const promisify = require('util').promisify;

/**
 * @param {string[]} platforms platforms for which to clean
 */
async function clean(platforms) {
	for (const p of platforms) {
		const Platform = require(`../${p}`); // eslint-disable-line security/detect-non-literal-require
		const platform = new Platform({});
		await promisify(platform.clean)();
	}
}
module.exports = clean;
