/**
 * Queues and sends analytics data to the Appcelerator cloud.
 *
 * @module analytics
 *
 * @copyright
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var path = require('path'),
	request = require('request'),
	crypto = require('crypto'),
	uuid = require('node-uuid'),
	async = require('async'),
	wrench = require('wrench'),
	auth = require('./auth'),
	fs = require('fs'),
	getOSInfo = require('./environ').getOSInfo,
	afs = require('./fs'),
	mix = require('./util').mix,
	timestamp = require('./time').timestamp,
	interfaces = require('./net').interfaces,
	urlEncode = require('./net').urlEncode,
	events = [],
	url = 'https://api.appcelerator.com/p/v1/app-track',
	sessionTimeout = 60 * 60 * 1000; // 1 hour

/**
 * An array of events that are queued up to be sent.
 */
exports.events = events;

/**
 * Adds an event to the array of events to be sent to the Appcelerator cloud.
 * @param {String} name - The name of the event
 * @param {*} data - The data payload
 * @param {String} type - The event type
 */
exports.addEvent = function addEvent(name, data, type) {
	events.push({
		id: uuid.v4(),
		type: type || 'app.feature',
		name: name,
		ts: timestamp(),
		data: data
	});
};

/**
 * Forks another node process with this file, then sends the child a message
 * containing the queue of events that need to be sent.
 * @param {Object} args - Send arguments
 * @param {String} args.appId - The Titanium CLI id
 * @param {String} args.appName - The Titanium CLI name
 * @param {String} args.appGuid - The Titanium CLI guid
 * @param {String} args.titaniumHomeDir - The Titanium home directory where the session files are stored
 * @param {String} args.version - The Titanium CLI version
 * @param {String} args.deployType - The deploy type which is always production
 * @param {String} args.httpProxyServer - The proxy server to use
 * @param {Boolean} args.showErrors - If true, displays errors with queuing events and posting them to the cloud
 * @param {Boolean} args.loggedIn - Indicates if the user is logged in
 * @param {String} args.uid - If logged in, the user's id
 * @param {String} args.guid - If logged in, the user's guid
 * @param {String} args.email - If logged in, the user's email address
 * @param {String} args.cookie - If logged in, the cookie assigned at the time of log in
 * @returns {Object} The forked child process
 */
exports.send = function send(args) {
	var child = require('child_process').fork(module.filename);
	args = args || {};
	args.events = [].concat(events);
	events = [];
	child.send(args);
	return child;
};

/**
 * When send() is called, fork() is called and a new Node.js instance will
 * trigger the "message" event where the event queue is sent to the Appcelerator
 * cloud servers.
 * @param {Object} args - Send arguments
 * @param {String} args.appId - The Titanium CLI id
 * @param {String} args.appName - The Titanium CLI name
 * @param {String} args.appGuid - The Titanium CLI guid
 * @param {String} args.titaniumHomeDir - The Titanium home directory where the session files are stored
 * @param {String} args.version - The Titanium CLI version
 * @param {String} args.deployType - The deploy type which is always production
 * @param {String} args.httpProxyServer - The proxy server to use
 * @param {Boolean} args.showErrors - If true, displays errors with queuing events and posting them to the cloud
 * @param {Boolean} args.loggedIn - Indicates if the user is logged in
 * @param {String} args.uid - If logged in, the user's id
 * @param {String} args.guid - If logged in, the user's guid
 * @param {String} args.email - If logged in, the user's email address
 * @param {String} args.cookie - If logged in, the cookie assigned at the time of log in
 */
process.on('message', function onMessage(args) {
	if (!args || !['appId', 'appName', 'appGuid', 'version'].every(function (p) { return args.hasOwnProperty(p) && args[p]; })) {
		return;
	}

	// check if there was URL override
	if (args.analyticsUrl) {
		url = args.analyticsUrl;
	}

	// 'directory' has been renamed to 'titaniumHomeDir', so we have to validate that either exists
	if ((!args.hasOwnProperty('directory') || !args.directory) && (!args.hasOwnProperty('titaniumHomeDir') || !args.titaniumHomeDir)) {
		return;
	}
	if (!args.titaniumHomeDir && args.directory) {
		args.titaniumHomeDir = args.directory;
	}

	var titaniumHomeDir = afs.resolvePath(args.titaniumHomeDir);

	// asynchronously get the machine id (mid), os info, and network interfaces
	async.parallel({
		mid: function (cb) {
			auth.getMID(titaniumHomeDir, function(mid) {
				cb(null, mid);
			});
		},

		osinfo: function (cb) {
			getOSInfo(function (info) {
				cb(null, info);
			});
		}
	}, function (err, results) {
		var eventsDir = path.join(titaniumHomeDir, 'events'),
			pidFile = path.join(titaniumHomeDir, 'analytics.pid'),
			sessionFile = path.join(titaniumHomeDir, 'analytics_session.json'),
			sid,
			sessionExpiration,
			now = Date.now(),
			restoredPreviousSession = false,
			mid = results.mid,
			status = auth.status(),
			sessionCookie = status.cookie && status.cookie.match(/(PHPSESSID=[A-Za-z0-9]+)/),
			cookie = (sessionCookie ? sessionCookie[1] + ';' : '') + 'uid=' + status.guid; // no, this is not a bug... it really is called uid and expects the guid

		// make sure the home directory exists
		fs.existsSync(titaniumHomeDir) || wrench.mkdirSyncRecursive(titaniumHomeDir);

		// make sure the events directory exists
		fs.existsSync(eventsDir) || wrench.mkdirSyncRecursive(eventsDir);

		function writeEvent(type, event, id, ts, data) {
			fs.writeFileSync(
				path.join(eventsDir, (new Date).toISOString().replace(/:/g, '-') + '_' + (Math.floor(Math.random() * 900) + 100) + '.json'),
				JSON.stringify(mix({
					event: event,
					type: type,
					sid: sid,
					guid: args.appGuid,
					mid: mid,
					mac_addr: '',
					ip: '',
					creator_user_id: args.uid,
					app_name: args.appName,
					app_version: args.version,
					version: args.version,
					tz: (new Date()).getTimezoneOffset(),
					ver: '2',
					un: args.email,
					data: JSON.stringify(data),
					id: id || uuid.v4(),
				}, results.osinfo))
			);
		}

		// do we have a valid session
		if (fs.existsSync(sessionFile)) {
			try {
				var analyticsSession = JSON.parse(fs.readFileSync(sessionFile));

				sid = analyticsSession.sid;
				sessionExpiration = analyticsSession.sessionExpiration;

				// if the expiration has expired, create a new one
				if (sid && sessionExpiration && sessionExpiration > now) {
					restoredPreviousSession = true;
				} else {
					// add the ti.end event
					writeEvent('ti.end', 'ti.end', null, null);
				}
			} catch (e) {} // file was malformed, treat as if a new session
		}

		// if the previous session was not restored, create a new one
		if (!restoredPreviousSession) {
			// need to generate a new session id
			fs.writeFileSync(sessionFile, JSON.stringify({
				mid: mid,
				sid: sid = uuid.v4(),
				sessionExpiration: sessionExpiration = now + sessionTimeout
			}));

			writeEvent('ti.start', 'ti.start', null, null, null);
		}

		// write the events to disk
		args.events.forEach(function (evt) {
			writeEvent(evt.type, evt.name, evt.id, evt.ts, evt.data);
		});

		function finalize() {
			// make sure we save the latest session expiration
			fs.writeFileSync(sessionFile, JSON.stringify({
				mid: mid,
				sid: sid,
				sessionExpiration: (new Date).getTime() + sessionTimeout
			}));

			// remove the pid file
			fs.existsSync(pidFile) && fs.unlinkSync(pidFile);
		}

		// if they're not logged in or we don't have a guid, then exit
		if (!status.loggedIn || !status.guid) {
			finalize();
			process.exit(0);
		}

		// now that the events are written to disk, check if there's another analytics process
		// sending events and if not, proceed to send the analytics events

		// check if there's already a pid
		while (fs.existsSync(pidFile)) {
			try {
				var pid = parseInt(fs.readFileSync(pidFile).toString().split('\n').shift());
				process.kill(pid, 0);

				// already running, exit
				process.exit(0);
			} catch (e) {
				// not running, continue!
				break;
			}
		}

		// write the pid file
		fs.writeFileSync(pidFile, process.pid);

		// send the analytics events, if any
		var files = fs.readdirSync(eventsDir);
		async.whilst(
			function () {
				return files.length;
			},
			function (next) {
				var filename = files.shift(),
					file = path.join(eventsDir, filename),
					payload = null

				if (!fs.existsSync(file) || !/\.json$/.test(filename)) return next();

				try {
					payload = JSON.parse(fs.readFileSync(file));
				} catch (ex) {}

				if (!payload) {
					fs.unlinkSync(file);
					return next();
				}

				request({
					uri: url,
					method: 'POST',
					proxy: args.httpProxyServer || undefined,
					headers: {
						Cookie: cookie
					},
					rejectUnauthorized: args.rejectUnauthorized === undefined ? true : !!args.rejectUnauthorized,
					body: urlEncode(payload)
				}, function (error, response, body) {
					if (!error && response.statusCode == 204 && fs.existsSync(file)) {
						fs.unlinkSync(file);
					}
					next();
				});
			},
			finalize
		);
	});
});