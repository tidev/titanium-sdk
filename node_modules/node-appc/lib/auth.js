/**
 * Performs authentication tasks including logging in the Appcelerator Network,
 * logging out, and checking session status.
 *
 * @module auth
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var __ = require('./i18n')(__dirname).__,
	fs = require('fs'),
	path = require('path'),
	crypto = require('crypto'),
	uuid = require('node-uuid'),
	wrench = require('wrench'),
	request = require('request'),
	net = require('./net'),
	mix = require('./util').mix,
	afs = require('./fs'),
	AppcException = require('./exception'),

	defaultTitaniumHomeDir = afs.resolvePath('~', '.titanium'),
	defaultLoginUrl = 'https://api.appcelerator.com/p/v1/sso-login',
	defaultLogoutUrl = 'https://api.appcelerator.com/p/v1/sso-logout',
	myAppc = 'https://my.appcelerator.com/',

	cachedStatus,
	cachedMid;

/**
 * Authenticates a user into the Appcelerator Network.
 * @param {Object} args - Login arguments
 * @param {String} args.username - The email address to log in as
 * @param {String} args.password - The password
 * @param {Function} args.callback(error, result) - The function to call once logged in or on error
 * @param {String} [args.titaniumHomeDir] - The Titanium home directory where the session files are stored
 * @param {String} [args.loginUrl] - The URL to authenticate against
 * @param {String} [args.proxy] - The proxy server to use
 */
exports.login = function login(args) {
	args || (args = {});
	args.titaniumHomeDir = afs.resolvePath(args.titaniumHomeDir || defaultTitaniumHomeDir);

	try {
		assertSessionFile(args.titaniumHomeDir);
	} catch (ex) {
		args.callback(ex);
		return;
	}

	cachedStatus = null;
	var sessionFile = path.join(args.titaniumHomeDir, 'auth_session.json');

	exports.getMID(args.titaniumHomeDir, function (mid) {
		// Otherwise we need to re-auth with the server
		request({
			uri: args.loginUrl || defaultLoginUrl,
			method: 'POST',
			proxy: args.proxy,
			jar: false, // don't save cookies
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			rejectUnauthorized: args.rejectUnauthorized === undefined ? true : !!args.rejectUnauthorized,
			body: net.urlEncode({
				un: args.username,
				pw: args.password,
				mid: mid
			})
		}, function (error, response, body) {
			try {
				if (error) {
					throw new Error(__('Error communicating with the server: %s', error));
				}

				var res = JSON.parse(body);
				if (res.success) {
					var cookie = response.headers['set-cookie'];
					if (cookie && cookie.length === 1 && cookie[0].match('^PHPSESSID')) {
						// Create the result
						var result = {
							loggedIn: true,
							cookie: cookie[0],
							data: {
								uid: res.uid,
								guid: res.guid,
								email: res.email
							}
						};

						// Write the data out to the session file
						if (!fs.existsSync(args.titaniumHomeDir)) {
							wrench.mkdirSyncRecursive(args.titaniumHomeDir);
						}
						fs.writeFileSync(sessionFile, JSON.stringify(result));

						args.callback(null, result);
					} else {
						throw new Error(__('Server did not return a session cookie'));
					}
				} else if (res.code === 4 || res.code === 5) {
					throw new Error(__('Invalid username or password. If you have forgotten your password, please visit %s.', myAppc.cyan));
				} else {
					throw new Error(__('Invalid server response'));
				}
			} catch (ex) {
				createLoggedOutSessionFile(args.titaniumHomeDir);
				args.callback(ex);
			}
		});
	});
};

/**
 * Logs the user out of the Appcelerator Network.
 * @param {Object} args - Logout arguments
 * @param {Function} args.callback(error, result) - The function to call once logged out or on error
 * @param {String} [args.titaniumHomeDir] - The Titanium home directory where the session files are stored
 * @param {String} [args.logoutUrl] - The URL to use to end session
 * @param {String} [args.proxy] - The proxy server to use
 */
exports.logout = function logout(args) {
	args || (args = {});
	args.titaniumHomeDir = afs.resolvePath(args.titaniumHomeDir || defaultTitaniumHomeDir);

	try {
		assertSessionFile(args.titaniumHomeDir);
	} catch (ex) {
		args.callback(ex);
		return;
	}

	cachedStatus = null;
	var sessionFile = path.join(args.titaniumHomeDir, 'auth_session.json');

	if (!fs.existsSync(sessionFile)) {
		// Create a default (logged out) session file
		args.callback(null, mix(createLoggedOutSessionFile(sessionFile), { success: true, alreadyLoggedOut: true }));
		return;
	}

	try {
		var session = JSON.parse(fs.readFileSync(sessionFile));
		if (session.loggedIn) {
			request({
				uri: args.logoutUrl || defaultLogoutUrl,
				method: 'GET',
				proxy: args.proxy,
				headers: {
					'Cookie': session.cookie
				},
				rejectUnauthorized: args.rejectUnauthorized === undefined ? true : !!args.rejectUnauthorized
			}, function (error, response, body) {
				var result = createLoggedOutSessionFile(sessionFile);
				try {
					if (error) {
						throw new Error(__('Error communicating with the server: %s', error));
					}

					var res = JSON.parse(body);
					if (res.success) {
						mix(result, { success: true, alreadyLoggedOut: false });
					} else {
						throw new Error(__('Error logging out from server: %s', res.reason));
					}

					args.callback(null, result);
				} catch (ex) {
					args.callback(ex, result);
				}
			});
		} else {
			args.callback(null, mix(session, { success: true, alreadyLoggedOut: true }));
		}
	} catch (ex) { // Invalid session file. This should never happen
		args.callback(ex, mix(createLoggedOutSessionFile(sessionFile), { success: true, alreadyLoggedOut: true }));
	}
};

/**
 * Returns whether the user is current logged in.
 * @param {Object} [args] - Status arguments
 * @param {String} [args.titaniumHomeDir] - The Titanium home directory where the session files are stored
 * @returns {Object} An object containing the session status
 */
exports.status = function status(args) {
	if (cachedStatus) return cachedStatus;

	args || (args = {});
	args.titaniumHomeDir = afs.resolvePath(args.titaniumHomeDir || defaultTitaniumHomeDir);

	var sessionFile = path.join(args.titaniumHomeDir, 'auth_session.json'),
		result = {},
		session;

	if (fs.existsSync(sessionFile)) {
		try {
			// Fetch and parse the session data
			session = JSON.parse(fs.readFileSync(sessionFile));
			result = {
				loggedIn: session.loggedIn,
				uid: session.data && session.data.uid,
				guid: session.data && session.data.guid,
				email: session.data && session.data.email,
				cookie: session.cookie
			};
		} catch (e) { // Invalid session file. This should never happen
			result = createLoggedOutSessionFile(sessionFile);
		}
	} else {
		result = createLoggedOutSessionFile(sessionFile); // No prior history, create a new logged out file
	}

	return cachedStatus = result;
};

/**
 * Returns the machine id (mid) or generates a new one based on the computer's
 * primary network interface's MAC address.
 * @param {String} titaniumHomeDir - The Titanium home directory where the session files are stored
 * @param {Function} callback - A callback to fire with the result
 */
exports.getMID = function getMID(titaniumHomeDir, callback) {
	if (cachedMid) {
		callback(cachedMid);
	} else {
		var midFile = path.join(titaniumHomeDir, 'mid.json');
		if (fs.existsSync(midFile)) {
			try {
				cachedMid = JSON.parse(fs.readFileSync(midFile)).mid;
				if (cachedMid) {
					callback(cachedMid);
					return;
				}
			} catch (e) {} // File/MID entry doesn't exist, so we need to recreate it
		}

		// If it got here, we couldn't fetch the previous MID
		net.interfaces(function (ifaces) {
			// Find the MAC address of the local ethernet card
			var macAddress,
				names = Object.keys(ifaces).sort(),
				i, j;

			for (i = 0; i < names.length; i++) {
				j = ifaces[names[i]];
				if (j.macAddress) {
					macAddress = j.macAddress;
					if (/^eth|en|Local Area Connection/.test(j)) {
						break;
					}
				}
			}

			macAddress || (macAddress = uuid.v4());

			// Create the MID, using the MAC address as a seed
			cachedMid = crypto.createHash('md5').update(macAddress).digest('hex');

			// Write the MID to its file
			if (!fs.existsSync(titaniumHomeDir)) {
				wrench.mkdirSyncRecursive(titaniumHomeDir);
			}
			fs.writeFileSync(midFile, JSON.stringify({ mid: cachedMid }));

			callback(cachedMid);
		});
	}
};

/**
 * Asserts the session file exists that the file is writable or the session file
 * does not exist and the Titanium home directory is writable.
 * @param {String} titaniumHomeDir - The Titanium home directory where the session files are stored
 * @throws {AppcException} If session file or Titanium home directory is not writable
 * @private
 */
function assertSessionFile(titaniumHomeDir) {
	var sessionFile = path.join(titaniumHomeDir, 'auth_session.json');

	// check that the file is writable
	if (fs.existsSync(sessionFile)) {
		if (!afs.isFileWritable(sessionFile)) {
			throw new AppcException(__('Session file "%s" is not writable', sessionFile), __('Please ensure the Titanium CLI has access to modify this file.'));
		}

	// check that the .titanium folder is writable
	} else if (fs.existsSync(titaniumHomeDir) && !afs.isDirWritable(titaniumHomeDir)) {
		throw new AppcException(__('Directory "%s" is not writable', titaniumHomeDir), __('Please ensure the Titanium CLI has access to this directory.'));
	}
}

/**
 * Creates the session file with a logged out status.
 * @param {String} sessionFile - Path to the session file.
 * @returns {Object} An object contain the logged out session status
 * @private
 */
function createLoggedOutSessionFile(sessionFile) {
	var result = { loggedIn: false },
		titaniumHomeDir = path.dirname(sessionFile),
		session, loggedIn;
	try {
		session = JSON.parse(fs.readFileSync(sessionFile));
		loggedIn = session.loggedIn;
		if (!fs.existsSync(titaniumHomeDir)) {
			wrench.mkdirSyncRecursive(titaniumHomeDir);
		}
		fs.writeFileSync(sessionFile, JSON.stringify(result));
	} catch (e) {
		result.loggedIn = loggedIn;
		result.error = e;
	}
	return result;
}