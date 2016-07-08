'use strict';

var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var find = require('node-pre-gyp').find;
var path = require('path');
var spawn = require('child_process').spawn;

/**
 * Resolves the native binding and if it doesn't exist, it will rebuild the
 * native module.
 *
 * @param {String} pkgJsonPath - Path to the native module's package.json.
 * @param {Function} callback - A function to call after the binding has been resolved.
 * @returns {EventEmitter}
 */
module.exports = function init(pkgJsonPath, callback) {
	var emitter = new EventEmitter();

	setImmediate(function () {
		var bindingPath = find(pkgJsonPath);
		if (existsSync(bindingPath)) {
			emitter.emit('success', bindingPath);
			return callback(null, bindingPath);
		}

		var npg = path.resolve(require.resolve('node-pre-gyp'), '../../bin/node-pre-gyp');
		var child = spawn(process.execPath, [npg, 'install', '--fallback-to-build'], { cwd: path.dirname(pkgJsonPath) });
		var stdout = '';
		var stderr = '';

		child.stdout.on('data', function (data) {
			data = data.toString();
			stdout += data;
			emitter.emit('stdout', data);
		});

		child.stderr.on('data', function (data) {
			data = data.toString();
			stderr += data;
			emitter.emit('stderr', data);
		});

		child.on('close', function (code) {
			var bindingPath;

			try {
				if (code) {
					var err = new Error('Rebuild failed:\n' + stderr.trim());
					err.code = code;
					throw err;
				}

				bindingPath = find(pkgJsonPath);
				if (!existsSync(bindingPath)) {
					throw new Error('Successfully rebuilt the native module, but unable to find it: ' + bindingPath);
				}
			} catch (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			emitter.emit('success', bindingPath);
			callback(null, bindingPath);
		});
	});

	return emitter;
}

/**
 * Helper function to check if a file exists.
 *
 * @param {String} file - The file to check if it exists.
 * @returns {Boolean}
 */
function existsSync(file) {
	try {
		fs.statSync(file);
		return true;
	} catch (e) {
		return false;
	}
}
