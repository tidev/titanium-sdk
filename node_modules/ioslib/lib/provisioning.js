/**
 * Detects provisioning profiles.
 *
 * @module provisioning
 *
 * @copyright
 * Copyright (c) 2014-2016 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 *
 * @requires certs
 */

const
	appc = require('node-appc'),
	certs = require('./certs'),
	magik = require('./utilities').magik,
	fs = require('fs'),
	path = require('path'),
	__ = appc.i18n(__dirname).__,
	defaultProfileDir = '~/Library/MobileDevice/Provisioning Profiles';

var cache = null,
	watchers = {};

/**
 * Fired when the provisioning profiles have been detected or updated.
 * @event module:provisioning#detected
 * @type {Object}
 */

/**
 * Fired when there was an error retreiving the provisioning profiles.
 * @event module:provisioning#error
 * @type {Error}
 */

exports.defaultProfileDir = defaultProfileDir;
exports.detect = detect;
exports.find = find;
exports.watch = watch;
exports.unwatch = unwatch;

/**
 * Detects installed provisioning profiles.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all provisioning profiles.
 * @param {String} [options.profileDir=~/Library/MobileDevice/Provisioning Profiles] - The path to search for provisioning profiles.
 * @param {Boolean} [options.unmanaged] - When true, excludes managed provisioning profiles.
 * @param {Boolean} [options.validOnly=true] - When true, only returns non-expired, valid provisioning profiles.
 * @param {Boolean} [options.watch=false] - If true, watches the specified provisioning profile directory for updates.
 * @param {Function} [callback(err, results)] - A function to call with the provisioning profile information.
 *
 * @emits module:provisioning#detected
 * @emits module:provisioning#error
 *
 * @returns {Handle}
 */
function detect(options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		var files = {},
			validOnly = options.validOnly === undefined || options.validOnly === true,
			profileDir = appc.fs.resolvePath(options.profileDir || defaultProfileDir),
			results = {
				provisioning: {
					profileDir: profileDir,
					development: [],
					adhoc: [],
					distribution: [],
				},
				issues: []
			},
			valid = {
				development: 0,
				adhoc: 0,
				distribution: 0
			},
			ppRegExp = /.+\.mobileprovision$/;

		if (options.watch) {
			var throttleTimer = null;

			if (!watchers[profileDir]) {
				watchers[profileDir] = {
					handle: fs.watch(profileDir, { persistent: false }, function (event, filename) {
						if (!ppRegExp.test(filename)) {
							// if it's not a provisioning profile, we don't care about it
							return;
						}

						var file = path.join(profileDir, filename);

						if (event === 'rename') {
							if (files[file]) {
								if (fs.existsSync(file)) {
									// change, reload the provisioning profile
									parseProfile(file);
								} else {
									// delete
									removeProfile(file);
								}
							} else {
								// add
								parseProfile(file);
							}
						} else if (event === 'change') {
							// updated
							parseProfile(file);
						}

						clearTimeout(throttleTimer);

						throttleTimer = setTimeout(function () {
							detectIssues();
							emitter.emit('detected', results);
						}, 250);
					}),
					count: 0
				};
			}

			watchers[profileDir].count++;
		}

		if (cache && !options.bypassCache) {
			emitter.emit('detected', cache);
			return callback(null, cache);
		}

		function detectIssues() {
			results.issues = [];

			if (!results.provisioning.development.length || !valid.development) {
				results.issues.push({
					id: 'IOS_NO_VALID_DEVELOPMENT_PROVISIONING_PROFILES',
					type: 'warning',
					message: __('Unable to find any valid iOS development provisioning profiles.') + '\n' +
						__('This will prevent you from building apps for testing on iOS devices.')
				});
			}

			if (!results.provisioning.adhoc.length || !valid.adhoc) {
				results.issues.push({
					id: 'IOS_NO_VALID_ADHOC_PROVISIONING_PROFILES',
					type: 'warning',
					message: __('Unable to find any valid iOS adhoc provisioning profiles.') + '\n' +
						__('This will prevent you from packaging apps for adhoc distribution.')
				});
			}

			if (!results.provisioning.distribution.length || !valid.distribution) {
				results.issues.push({
					id: 'IOS_NO_VALID_DISTRIBUTION_PROVISIONING_PROFILES',
					type: 'warning',
					message: __('Unable to find any valid iOS distribution provisioning profiles.') + '\n' +
						__('This will prevent you from packaging apps for AppStore distribution.')
				});
			}
		}

		function removeProfile(file) {
			var r = results[files[file]],
				i = 0,
				l = r.length;
			for (; i < l; i++) {
				if (r[i].file === file) {
					r.splice(i, 1);
					break;
				}
			}
			delete files[file];
		}

		function parseProfile(file) {
			if (!fs.existsSync(file)) {
				return;
			}

			var contents = fs.readFileSync(file).toString(),
				i = contents.indexOf('<?xml'),
				j = i === -1 ? i : contents.lastIndexOf('</plist>');

			if (j === -1) return;

			var plist = new appc.plist().parse(contents.substring(i, j + 8)),
				dest = 'development',
				appPrefix = (plist.ApplicationIdentifierPrefix || []).shift(),
				entitlements = plist.Entitlements || {},
				expired = false;

			if (!plist.ProvisionedDevices || !plist.ProvisionedDevices.length) {
				dest = 'distribution';
			} else if (new Buffer(plist.DeveloperCertificates[0].value, 'base64').toString().indexOf('Distribution:') != -1) {
				dest = 'adhoc';
			}

			try {
				if (plist.ExpirationDate) {
					expired = new Date(plist.ExpirationDate) < new Date;
				}
			} catch (e) {}

			if (!expired) {
				valid[dest]++;
			}

			// store which bucket the provisioning profile is in
			files[file] && removeProfile(file);
			files[file] = dest;

			var managed = plist.Name.indexOf('iOS Team Provisioning Profile') !== -1;

			if ((!validOnly || !expired) && (!options.unmanaged || !managed)) {
				results.provisioning[dest].push({
					file: file,
					uuid: plist.UUID,
					name: plist.Name,
					managed: managed,
					appPrefix: appPrefix,
					creationDate: plist.CreationDate,
					expirationDate: plist.ExpirationDate,
					expired: expired,
					certs: Array.isArray(plist.DeveloperCertificates)
						? plist.DeveloperCertificates.map(function (cert) { return cert.value; })
						: null,
					devices: plist.ProvisionedDevices || null,
					team: plist.TeamIdentifier || null,
					entitlements: entitlements,
					// TODO: remove all of the entitlements below and just use the `entitlements` property
					appId: (entitlements['application-identifier'] || '').replace(appPrefix + '.', ''),
					getTaskAllow: !!entitlements['get-task-allow'],
					apsEnvironment: entitlements['aps-environment'] || ''
				});
			}
		}

		fs.exists(profileDir, function (exists) {
			exists && fs.readdirSync(profileDir).forEach(function (name) {
				ppRegExp.test(name) && parseProfile(path.join(profileDir, name));
			});

			detectIssues();
			cache = results;
			emitter.emit('detected', results);
			return callback(null, results);
		});
	});
};

/**
 * Finds all provisioning profiles that match the specified developer cert name
 * and iOS device UDID.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.appId] - The app identifier (com.domain.app) to filter by.
 * @param {Object|Array<Object>} [options.certs] - One or more certificate descriptors to filter by.
 * @param {String|Array<String>} [options.deviceUDIDs] - One or more iOS device UDIDs to filter by.
 * @param {Boolean} [options.unmanaged] - When true, excludes managed provisioning profiles.
 * @param {Boolean} [options.validOnly=true] - When true, only returns valid profiles.
 * @param {Function} callback(err, results) - A function to call with an array of matching provisioning profiles.
 */
function find(options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	} else if (!options) {
		options = {};
	}
	typeof callback === 'function' || (callback = function () {});

	var deviceUDIDs = (Array.isArray(options.deviceUDIDs) ? options.deviceUDIDs : [ options.deviceUDIDs ]).filter(function (a) { return a; }),
		certs = (Array.isArray(options.certs) ? options.certs : [ options.certs ]).filter(function (a) { return a; });

	options.validOnly = options.validOnly === undefined || options.validOnly === true;

	exports.detect(options, function (err, results) {
		if (err) {
			return callback(err);
		} else {
			var profiles = [];

			function check(scope) {
				scope.forEach(function (pp) {
					// check app id
					if (options.appId && !(new RegExp('^' + pp.appId.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$')).test(options.appId)) {
						return;
					}

					// check certs
					if (certs.length) {
						var match = false;
						for (var i = 0, l = certs.length; i < l; i++) {
							var prefix = certs[i].pem.replace(/^-----BEGIN CERTIFICATE-----\n/, '').substring(0, 60);
							if (pp.certs.some(function (cert) { return cert.indexOf(prefix) === 0; })) {
								match = true;
								break;
							}
						}
						if (!match) return;
					}

					// check device uuids
					if (deviceUDIDs.length && (pp.devices === null || !deviceUDIDs.some(function (d) { return pp.devices.indexOf(d) !== -1; }))) {
						return;
					}

					profiles.push(pp);
				});
			}

			check(results.provisioning.development);
			check(results.provisioning.distribution);
			check(results.provisioning.adhoc);

			return callback(null, profiles);
		}
	});
};

/**
 * Watches a provisioning profile directory for file changes.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.profileDir=~/Library/MobileDevice/Provisioning Profiles] - The path to search for provisioning profiles.
 * @param {Function} [callback(err, results)] - A function to call with the provisioning profile information.
 *
 * @returns {Function} A function that unwatches changes.
 */
function watch(options, callback) {
	if (typeof options === 'function') {
		callback = options;
		options = {};
	} else if (!options) {
		options = {};
	}

	options.watch = true;
	options.bypassCache = true;

	exports.detect(options, callback);

	return function () {
		unwatch(options.profileDir);
	};
};

/**
 * Stops watching the specified provisioning profile directory.
 *
 * @param {String} [profileDir=~/Library/MobileDevice/Provisioning Profiles] - The path to the provisioning profile directory.
 */
function unwatch(profileDir) {
	var profileDir = appc.fs.resolvePath(profileDir || defaultProfileDir);

	if (!watchers[profileDir]) return;

	if (--watchers[profileDir].count <= 0) {
		watchers[profileDir].handle.close();
		delete watchers[profileDir];
	}
};

/*
 * If the app exits, close all filesystem watchers.
 */
process.on('exit', function () {
	Object.keys(watchers).forEach(function (w) {
		watchers[w].handle.close();
		delete watchers[w];
	});
});
