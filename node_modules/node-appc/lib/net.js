/**
 * Network related functions.
 *
 * @module net
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var async = require('async'),
	dns = require('dns'),
	interfaces;

/**
 * Detects all network interfaces.
 * @param {Function} callback - The function to call with the results
 */
exports.interfaces = function (callback) {
	if (interfaces) {
		callback(interfaces);
		return;
	}

	var ifaces = require('os').networkInterfaces(),
		exec = require('child_process').exec,
		cmds = process.platform == 'win32' ? ['ipconfig /all'] : ['/sbin/ifconfig', '/bin/ifconfig', 'ifconfig'],
		gateway = {
			darwin: function (ifaces, output, done) {
				exec('netstat -nr', function (err, stdout, stderr) {
					var m, re = /^default\s+([^\s]+).*?(\S+)$/gm;
					while (m = re.exec(stdout)) {
						if (m[2] && ifaces[m[2]]) {
							ifaces[m[2]].gateway = m[1];
						}
					}
					done();
				});
			},
			linux: function (ifaces, output, done) {
				exec('ip route', function (err, stdout, stderr) {
					var m, re = /^default via ([^\s]+) dev (\S+)\s*$/gm;
					while (m = re.exec(stdout)) {
						if (m[2] && ifaces[m[2]]) {
							ifaces[m[2]].gateway = m[1];
						}
					}
					done();
				});
			},
			win32: function (ifaces, output, done) {
				var re = /Default Gateway[^\:]+\:\s*([^\s]+)/,
					chunks = output.split(new RegExp('(' + Object.keys(ifaces).join('|') + ')', 'm')).slice(1),
					i = 0,
					len = chunks.length,
					m;
				for (; i < len; i++) {
					if (ifaces[chunks[i]] && i + 1 < len) {
						if (m = re.exec(chunks[i+1])) {
							ifaces[chunks[i]].gateway = m[1];
						}
						i++;
					}
				}
				done();
			}
		};

	// need to re-map the interface structure to make room for the mac address
	Object.keys(ifaces).forEach(function (dev) {
		ifaces[dev] = { ipAddresses: ifaces[dev] };
	});

	callback = callback || function () {};

	(function go() {
		var cmd = cmds.shift();
		if (cmd) {
			exec(cmd, function (err, stdout, stderr) {
				if (err) {
					go();
					return;
				}

				var macs = {};

				// parse the mac addresses
				stdout.replace(/\r\n|\r/g, '\n')					// remove all \r
					.replace(/\n\n/g, '\n')							// remove double lines
					.replace(/[\n][\t ]/g, ' ')						// if the next line indents, bring it up a line
					.replace(/   /g, '~')							// if indented with spaces, mark with ~ so we can match
					.replace(/ethernet adapter ([^:]*:)/ig, '$1')	// on Windows, remove "Ethernet adapter"
					.split('\n').forEach(function (line) {
						if (line = line.trim()) {
							var m = line.match(/([^:~]*).*?((?:[0-9A-F][0-9A-F][:-]){5}[0-9A-F][0-9A-F])/i);
							m && m.length > 1 && m[2] && (macs[m[1]] = m[2]);
						}
					});

				// set the mac address, if it exists
				Object.keys(ifaces).forEach(function (dev) {
					macs[dev] && (ifaces[dev].macAddress = macs[dev]);
				});

				gateway[process.platform](ifaces, stdout, function () {
					callback(interfaces = ifaces);
				});
			});
		} else {
			callback(interfaces = ifaces);
		}
	}());
};

/**
 * Determines if the current computer is online.
 * @param {Function} callback - The function to call with the result
 */
exports.online = function online(callback) {
	dns.resolve('api.appcelerator.com', function (err) {
		callback(null, !err);
	});
};

/**
 * Converts an object into an escaped URL-safe string.
 * @param {Object} obj - The object to convert
 * @returns {String} The serialized object
 */
exports.urlEncode = function urlEncode(obj) {
	var enc = encodeURIComponent,
		pairs = [],
		prop, value, i, l;

	for (prop in obj) {
		if (obj.hasOwnProperty(prop)) {
			Array.isArray(value = obj[prop]) || (value = [value]);
			prop = enc(prop) + '=';
			for (i = 0, l = value.length; i < l;) {
				pairs.push(prop + enc(value[i++]));
			}
		}
	}

	return pairs.join('&');
}
