/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

import appc from 'node-appc';
import fs from 'fs-extra';

/**
 * Validate a keystore path, accepting one matching pair of exterior quotes.
 * @param {string} input Keystore path as entered by the user.
 * @param {Function} callback Receives an error or the resolved absolute path.
 */
export function validateKeystorePath(input, callback) {
	if (!input) {
		return callback(new Error('Please specify the path to your keystore file'));
	}

	let keystoreFile = appc.fs.resolvePath(input);
	if (fs.existsSync(keystoreFile) && fs.statSync(keystoreFile).isFile()) {
		return callback(null, keystoreFile);
	}

	// Try the literal name first: quotes can be part of a real filename.
	const quote = input[0];
	if (input.length >= 2 && (quote === "'" || quote === '"') && input[input.length - 1] === quote) {
		keystoreFile = appc.fs.resolvePath(input.slice(1, -1));
		if (fs.existsSync(keystoreFile) && fs.statSync(keystoreFile).isFile()) {
			return callback(null, keystoreFile);
		}
	}

	callback(new Error('Invalid keystore file'));
}
