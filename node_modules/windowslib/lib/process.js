/**
 * Windows process functions.
 *
 * @module process
 *
 * @copyright
 * Copyright (c) 2014-2016 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	async = require('async'),
	fs = require('fs'),
	magik = require('./utilities').magik,
	path = require('path'),
	__ = appc.i18n(__dirname).__,
	LIST_RE = /^([^:]+):\s+(.*)$/;

exports.list = list;
exports.find = find;

/**
 * Returns a list of running processes.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.tasklist] - The path to the 'tasklist' executable.
 * @param {Function} [callback(err, results)] - A function to call with the list of processes.
 *
 * @emits module:process#processes
 * @emits module:process#error
 *
 * @returns {EventEmitter}
 */
function list(options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		appc.subprocess.run(options.tasklist || 'tasklist', ['/FO', 'LIST', '/V'], function (code, out, err) {
			var processes = [];

			if (code) {
				var ex = new Error(__('Failed to run "%s"', 'tasklist'));
				emitter.emit('error', ex);
				return callback(ex);
			}

			out.trim().split(/\r\n\r\n|\n\n/).forEach(function (chunk) {
				var obj = parseProcessOutput(chunk);
				processes.push(obj);
			});

			emitter.emit('processes', processes);
			callback(null, processes);
		});
	});
};

/**
 * Returns a single running process's info. If it's not running, we return null.
 *
 * @param {String} pid - The process if od the process we're looking for.
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.tasklist] - The path to the 'tasklist' executable.
 * @param {Function} [callback(err, results)] - A function to call with the process.
 *
 * @emits module:process#process
 * @emits module:process#error
 *
 * @returns {EventEmitter}
 */
function find(pid, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		appc.subprocess.run(options.tasklist || 'tasklist', ['/FI', 'PID eq ' + pid, '/FO', 'LIST', '/V'], function (code, out, err) {
			var processes = [];

			if (code) {
				var ex = new Error(__('Failed to run "%s"', 'tasklist'));
				emitter.emit('error', ex);
				return callback(ex);
			}

			if (out.indexOf('PID:') == -1) {
				// not running
				return callback();
			}
			var obj = parseProcessOutput(out.trim());
			emitter.emit('process', obj);
			callback(null, obj);
		});
	});
};

function parseProcessOutput(chunk) {
	var obj = {};
	chunk.split(/\r\n|\n/).forEach(function (line) {
		var m = line.match(LIST_RE);
		if (!m) return;

		switch (m[1].toLowerCase()) {
			case 'image name':    obj.name  = m[2];    break;
			case 'pid':           obj.pid   = ~~m[2];  break;
			case 'window title':  obj.title = m[2];    break;
		}
	});
	return obj;
}
