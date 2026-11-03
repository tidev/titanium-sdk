/**
 * Helpers for Icon Composer documents (`.icon`).
 *
 * These live outside the build command so they can be unit tested -- `_build.js` constructs a
 * CLI-bound builder at import time and can't be loaded standalone.
 *
 * @copyright
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import fs from 'fs-extra';
import path from 'node:path';

/**
 * Determines whether a path is an Icon Composer document.
 *
 * Icon Composer documents are directories, so a plain file with the same name is not one. A
 * missing path is not an error, it just isn't a document.
 *
 * @param {String} file The path to check
 * @returns {Boolean} `true` if the path is an Icon Composer document
 */
export function isIconComposerDocument(file) {
	return fs.statSync(file, { throwIfNoEntry: false })?.isDirectory() === true;
}

/**
 * Computes a hash of every file in an Icon Composer document so a build can tell when the
 * document has changed.
 *
 * The walk is sorted so the hash is stable regardless of the order the filesystem returns
 * entries in, and it includes each file's path so moving content between files is detected.
 * Broken symlinks are skipped, matching how `copyDirSync()` copies the same document.
 *
 * @param {String} dir The path to the Icon Composer document
 * @param {Function} hash A function that hashes a string or buffer, e.g. `Builder.hash()`
 * @returns {String} A hash of the document's contents
 */
export function hashIconComposerDocument(dir, hash) {
	const hashes = [];

	(function walk(dir, prefix) {
		for (const name of fs.readdirSync(dir).sort()) {
			const file = path.join(dir, name);
			const rel = prefix ? prefix + '/' + name : name;
			const stat = fs.statSync(file, { throwIfNoEntry: false });

			if (!stat) {
				// broken symlink
				continue;
			}

			if (stat.isDirectory()) {
				walk(file, rel);
			} else {
				hashes.push(rel + ':' + hash(fs.readFileSync(file)));
			}
		}
	}(dir, ''));

	return hash(hashes.join(','));
}
