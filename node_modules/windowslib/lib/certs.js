/**
 * Certificate management tools.
 *
 * @module certs
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	fs = require('fs'),
	magik = require('./utilities').magik,
	moment = require('moment'),
	path = require('path'),
	visualstudio = require('./visualstudio'),
	wrench = require('wrench'),
	__ = appc.i18n(__dirname).__;

exports.create = create;

/**
 * Launches native dialogs for generating a certificate.
 *
 * @param {String} appid - The application's id.
 * @param {String} certificateFile - The path where the certificate is to be created.
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.powershell='powershell'] - Path to the 'powershell' executable.
 * @param {String} [options.pvk2pfx='Pvk2Pfx'] - The path to the 'pvk2pfx' executable.
 * @param {Function} [callback(err, certificateFile)] - A function to call after the cert has been created.
 *
 * @emits module:certs#created
 * @emits module:certs#error
 *
 * @returns {EventEmitter}
 */
function create(appid, certificateFile, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (typeof appid !== 'string' || !appid) {
			var ex = new Error(__('Missing required "%s" argument', 'appid'));
			emitter.emit('error', ex);
			return callback(ex);
		}

		if (typeof certificateFile !== 'string' || !certificateFile) {
			var ex = new Error(__('Missing required "%s" argument', 'certificateFile'));
			emitter.emit('error', ex);
			return callback(ex);
		}

		var certDir = path.dirname(certificateFile),
			certPath = certificateFile.replace(/\..+$/, '');

		if (!fs.existsSync(certDir)) {
			wrench.mkdirSyncRecursive(certDir);
		}

		visualstudio.detect(options, function (err, results) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			var vsInfo = results.selectedVisualStudio;

			if (!vsInfo) {
				var ex = new Error(__('Unable to find a supported Visual Studio installation'));
				emitter.emit('error', ex);
				return callback(ex);
			}

			appc.subprocess.getRealName(path.resolve(__dirname, '..', 'bin', 'winstore_create_cert.ps1'), function (err, psScript) {
				if (err) {
					emitter.emit('error', err);
					return callback(err);
				}

				// first lets create the cert
				appc.subprocess.run(vsInfo.vcvarsall, [
					'&&',
					options.powershell || 'powershell',
					'-ExecutionPolicy', 'Bypass', '-File', psScript,
					appid,
					moment().add(2, 'years').format('L'),
					'"' + certPath + '"'
				], function (code, out, err) {
					if (code) {
						var ex = new Error(__('Failed to create certificate (code %s)', code));
						emitter.emit('error', ex);
						return callback(ex);
					}

					// package the certificate as pfx
					appc.subprocess.run(vsInfo.vcvarsall, [
						'&&', options.pvk2pfx || 'Pvk2Pfx',
						'/pvk', certPath + '.pvk',
						'/spc', certPath + '.cer',
						'/pfx', certPath + '.pfx'
					], function (code, out, err) {
						fs.existsSync(certPath + '.pvk') && fs.unlinkSync(certPath + '.pvk');
						fs.existsSync(certPath + '.cer') && fs.unlinkSync(certPath + '.cer');

						if (code) {
							var ex = new Error(__('Failed to convert certificate to pfx (code %s)', code));
							emitter.emit('error', ex);
							callback(ex);
						} else {
							emitter.emit('created', certPath + '.pfx');
							callback(null, certPath + '.pfx');
						}
					});
				});
			});
		});
	});
}
