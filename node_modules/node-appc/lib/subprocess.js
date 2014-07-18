/**
 * Library to make finding and spawning processes easier.
 *
 * @module subprocess
 *
 * @copyright
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var cp = require('child_process'),
	exec = cp.exec,
	spawn = cp.spawn,
	async = require('async'),
	path = require('path'),
	fs = require('fs'),
	afs = require('./fs');

/**
 * Spawns a subprocess using exec()-like syntax, but using spawn().
 * @param {String} cmd - The command to run
 * @param {Array} args - An array of arguments
 * @param {Object} [opts] - Options to pass to spawn()
 * @param {Function} callback - Function to call when the process finishes
 */
exports.run = function run(cmd, args, opts, callback) {
	if (typeof args == 'function') {
		callback = args;
		args = null;
		opts = {};
	} else if (typeof opts == 'function') {
		callback = opts;
		opts = {};
	}

	args = args ? (Array.isArray(args) ? args : [args]) : null;

	// when calling a Windows batch file, we need to escape ampersands in the command
	if (process.platform == 'win32' && /\.bat$/.test(cmd)) {
		args.unshift('/S', '/C', cmd.replace(/\&/g, '^&'));
		cmd = 'cmd.exe';
	}

	var child = spawn(cmd, args, opts),
		out = '',
		err = '';

	child.stdout.on('data', function (data) {
		out += data.toString();
	});

	child.stderr.on('data', function (data) {
		err += data.toString();
	});

	child.on('close', function (code) {
		callback(code, out, err);
	});
};

/**
 * Tries to locate an executable by looking an array of files or paths.
 * @param {String|Array} files - An array of absolute or relative files to check
 * @param {Function} callback - A function to call when done searching
 */
exports.findExecutable = function findExecutable(files, finished) {
	// path can be a path full path to the program or just the program name where we check the path
	var find = process.platform == 'win32'
			?	function (file, callback) {
					file = file.replace(/\//g, '\\');
					if (file.indexOf('\\') != -1) {
						if (fs.existsSync(file = afs.resolvePath(file))) {
							return finished(null, file);
						}
					} else if (process.env.PATH) {
						// we need to search the system path
						var dirs = process.env.PATH.split(';'),
							i = 0,
							len = dirs.length,
							fullpath;
						while (i < len) {
							fullpath = path.join(dirs[i].trim(), file);
							if (fs.existsSync(fullpath)) {
								return finished(null, fullpath);
							}
							i++;
						}
					}
					callback(); // go to next item in the queue
				}
			:	function (file, callback) {
					// pray we find 'which'
					exports.run(fs.existsSync('/usr/bin/which') ? '/usr/bin/which' : 'which', file, function (err, stdout, stderr) {
						if (err) {
							callback(); // go to next item in the queue
						} else {
							finished(null, stdout.split('\n').shift().trim());
						}
					});
				},
		queue = async.queue(find, 1);

	queue.drain = function () {
		// not found :(
		finished(new Error('Unable to find executable'), null);
	};

	Array.isArray(files) || (files = [ files ]);

	queue.push(files.filter(function (p) { return !!p; }));
};

/**
 * For Windows, try to get the 8.3 formatted filename.
 * @param {String} file - The file or folder to discover the real name of
 * @param {Function} callback - A function to call after determining the real filename
 */
exports.getRealName = function getRealName(file, callback) {
	// for linux and mac os x, we simply return the original filename
	if (process.platform != 'win32') {
		return callback(null, file);
	}

	// for windows, we will determine the 8.3 formatted name
	exec('cmd /c for %A in ("' + file + '") do @echo %~sA', function (code, out, err) {
		callback(code, !code && out.trim().split('\n').shift());
	});
};