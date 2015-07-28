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

var afs = require('./fs'),
	auth = require('./auth'),
	async = require('async'),
	colors = require('colors'),
	fork = require('child_process').fork,
	fs = require('fs'),
	getOSInfo = require('./environ').getOSInfo,
	i18n = require('./i18n')(__dirname),
	mix = require('./util').mix,
	path = require('path'),
	request = require('request'),
	timestamp = require('./time').timestamp,
	urlEncode = require('./net').urlEncode,
	uuid = require('node-uuid'),
	wrench = require('wrench'),
	__ = i18n.__,
	__n = i18n.__n,

	analyticsEvents = [],
	url = 'https://api.appcelerator.com/p/v1/app-track',
	sessionTimeout = 60 * 60 * 1000; // 1 hour

/**
 * An array of events that are queued up to be sent.
 */
exports.events = analyticsEvents;

/**
 * Adds an event to the array of events to be sent to the Appcelerator cloud.
 * @param {String} name - The name of the event
 * @param {*} data - The data payload
 * @param {String} type - The event type
 */
exports.addEvent = function addEvent(name, data, type) {
	analyticsEvents.push({
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
 * @param {Boolean} [args.rejectUnauthorized=false] - Rejects unauthorized certificates
 * @param {String} args.analyticsUrl - An alternative URL to send analytics to instead of the default
 * @param {String} args.version - The Titanium CLI version
 * @param {String} args.deployType - The deploy type which is always production
 * @param {String} args.httpProxyServer - The proxy server to use
 * @param {String} args.uid - If logged in, the user's id
 * @param {String} args.guid - If logged in, the user's guid
 * @param {String} args.email - If logged in, the user's email address
 * @param {Object} [args.logger] - The logger instance
 * @param {Boolean} [args.debug=false] - Displays debug logging when true
 * @param {Function} [callback(err, childProcess)] - A function to call after the analytics have been saved, but not sent
 */
exports.send = function send(args, callback) {
	args = args || {};
	var events = [].concat(analyticsEvents);
	analyticsEvents = [];

	var logger = {
		debug: args.debug && args.logger && args.logger.debug || function () {},
		log: args.debug && args.logger && args.logger.log || function () {}
	};

	var titaniumHomeDir;
	if (args.titaniumHomeDir) {
		titaniumHomeDir = afs.resolvePath(args.titaniumHomeDir);
	} else if (args.directory) {
		titaniumHomeDir = afs.resolvePath(args.directory);
	}
	if (!titaniumHomeDir || !fs.existsSync(titaniumHomeDir)) {
		titaniumHomeDir = afs.resolvePath('~/.titanium');
	}

	logger.debug(__('Processing analytics'));
	logger.debug(__('Titanium home directory: %s', titaniumHomeDir.cyan));

	// asynchronously get the machine id (mid) and os info
	async.parallel({
		mid: function (cb) {
			auth.getMID(titaniumHomeDir, function(mid) {
				logger.debug(__('Machine ID: %s', String(mid).cyan));
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
			sessionFile = path.join(titaniumHomeDir, 'analytics_session.json'),
			sid,
			sessionExpiration,
			now = Date.now(),
			restoredPreviousSession = false,
			mid = results.mid;

		// make sure the home directory exists
		if (!fs.existsSync(titaniumHomeDir)) {
			logger.debug(__('Creating Titanium home directory'));
			wrench.mkdirSyncRecursive(titaniumHomeDir);
		}

		// make sure the events directory exists
		if (!fs.existsSync(eventsDir)) {
			logger.debug(__('Creating analytics events directory'));
			wrench.mkdirSyncRecursive(eventsDir);
		}

		function writeEvent(type, event, id, ts, data) {
			var file = path.join(eventsDir, (new Date).toISOString().replace(/:/g, '-') + '_' + (Math.floor(Math.random() * 9000) + 1000) + '.json'),
				json = mix({
					event: event,
					type: type,
					sid: sid,
					guid: args.appGuid,
					mid: mid,
					mac_addr: '',
					ip: '',
					creator_user_id: null,
					app_name: args.appName,
					app_version: args.version,
					version: args.version,
					tz: (new Date()).getTimezoneOffset(),
					ver: '3',
					un: args.email,
					data: JSON.stringify(data),
					id: id || uuid.v4()
				}, results.osinfo);

			logger.debug(__('Writing event to file: %s', file.cyan));
			logger.log(JSON.stringify(json, null, '\t').grey);

			fs.writeFileSync(file, JSON.stringify(json));
		}

		// do we have a valid session
		if (fs.existsSync(sessionFile)) {
			try {
				logger.debug(__('Reading session file: %s', sessionFile.cyan));
				var analyticsSession = JSON.parse(fs.readFileSync(sessionFile));

				sid = analyticsSession.sid;
				sessionExpiration = analyticsSession.sessionExpiration;

				// if the expiration has expired, create a new one
				if (sid && sessionExpiration && sessionExpiration > now) {
					logger.debug(__('Session is valid'));
					restoredPreviousSession = true;
				} else {
					// add the ti.end event
					logger.debug(__('Session expired, adding ti.end event'));
					writeEvent('ti.end', 'ti.end', null, null);
				}
			} catch (e) {} // file was malformed, treat as if a new session
		}

		// if the previous session was not restored, create a new one
		if (!restoredPreviousSession) {
			logger.debug(__('Creating new session'));

			// need to generate a new session id
			fs.writeFileSync(sessionFile, JSON.stringify({
				mid: mid,
				sid: sid = uuid.v4(),
				sessionExpiration: sessionExpiration = now + sessionTimeout
			}));

			logger.debug(__('Adding ti.start event'));
			writeEvent('ti.start', 'ti.start', null, null, null);
		}

		// write the events to disk
		logger.debug(__n('Adding %%s event', 'Adding %%s events', events.length, String(events.length).cyan));
		events.forEach(function (evt) {
			writeEvent(evt.type, evt.name, evt.id, evt.ts, evt.data);
		});

		// make sure we save the latest session expiration
		logger.debug(__('Updating session file'));
		fs.writeFileSync(sessionFile, JSON.stringify({
			mid: mid,
			sid: sid,
			sessionExpiration: (new Date).getTime() + sessionTimeout
		}));

		logger.debug(__('Forking analytics send process') + '\n');

		var child = fork(module.filename);
		// note: the message cannot exceed 8,192 bytes
		child.send({
			debug: args.debug && args.logger && !args.logger.silent,
			proxy: args.httpProxyServer,
			rejectUnauthorized: args.rejectUnauthorized,
			titaniumHomeDir: titaniumHomeDir,
			url: args.analyticsUrl || url
		});
		child.unref();

		callback && callback(null, child);
	});
};

/**
 * When send() is called, fork() is called and a new Node.js instance will
 * trigger the "message" event where the event queue is sent to the Appcelerator
 * cloud servers.
 * @param {Object} args - Send arguments
 * @param {Boolean} [args.debug=false] - Displays debug logging when true
 * @param {String} args.proxy - The proxy server to use
 * @param {Boolean} [args.rejectUnauthorized=false] - Rejects unauthorized certificates
 * @param {String} args.titaniumHomeDir - The Titanium home directory where the session files are stored
 * @param {String} args.url - The URL to send analytics to
 */
process.on('message', function (args) {
	process.disconnect();

	if (!args || !args.titaniumHomeDir || !args.url) return;

	// faux logger
	var logger = {
		debug: args.debug && function () { console.log.apply(null, ['[DEBUG]'.magenta].concat(Array.prototype.slice.call(arguments))); } || function () {},
		log: args.debug && console.log || function () {}
	};

	logger.log('\n');
	logger.debug(__('Analytics send process'));

	var eventsDir = path.join(args.titaniumHomeDir, 'events'),
		pidFile = path.join(args.titaniumHomeDir, 'analytics.pid');

	logger.debug(__('Analytics URL: %s', args.url.cyan));
	logger.debug(__('Titanium home directory: %s', args.titaniumHomeDir.cyan));
	logger.debug(__('Analytics events directory: %s', eventsDir.cyan));
	logger.debug(__('pid file: %s', pidFile.cyan));

	// check if there's already a pid
	while (fs.existsSync(pidFile)) {
		try {
			var pid = parseInt(fs.readFileSync(pidFile).toString().split('\n').shift());
			logger.debug(__('pid file exists, check if pid %s is running', String(pid).cyan));
			process.kill(pid, 0);

			// already running, exit
			logger.debug(__('Another analytics send process is running, exiting'));
			process.exit(0);
		} catch (e) {
			// not running, continue!
			logger.debug(__('Stale pid file found, continuing'));
			break;
		}
	}

	// write the pid file
	logger.debug(__('Writing new pid file: %s', String(process.pid).cyan));
	fs.writeFileSync(pidFile, process.pid);

	// send the analytics events, if any
	var files = fs.readdirSync(eventsDir);
	logger.debug(__n('Found %%s event', 'Found %%s events', files.length, String(files.length).cyan));

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

			var params = {
					uri: args.url,
					method: 'POST',
					proxy: args.proxy || undefined,
					rejectUnauthorized: args.rejectUnauthorized === undefined ? true : !!args.rejectUnauthorized,
					body: urlEncode(payload)
				};

			logger.debug(__('Sending event: %s', file.cyan));
			logger.log(JSON.stringify(params, null, '\t').grey);

			request(params, function (error, response, body) {
				if (error) {
					logger.debug(__('Error sending event:'));
					logger.debug(error);
				} else if (response.statusCode == 204) {
					logger.debug(__('Event sent successfully'));
					if (fs.existsSync(file)) {
						logger.debug(__('Removing event: %s', file.cyan));
						fs.unlinkSync(file);
					}
				} else {
					logger.debug(__('Event was not sent successfully'));
					logger.debug(__('Expected HTTP status code %s, got %s', 204, String(response.statusCode).cyan));
				}
				next();
			});
		},
		function () {
			// remove the pid file
			logger.debug(__('Deleting pid file: %s', pidFile.cyan));
			fs.existsSync(pidFile) && fs.unlinkSync(pidFile);

			logger.debug(__('All events processed'));
			logger.log();
			logger.debug(__('Press ENTER to redraw prompt'));
			logger.log();
		}
	);
});