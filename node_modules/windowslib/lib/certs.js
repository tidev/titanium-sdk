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
	cp = require('child_process'),
	exec = cp.exec,
	__ = appc.i18n(__dirname).__;

exports.create = create;
exports.generate = generate;
exports.generatePFX = generatePFX;
exports.thumbprint = thumbprint;

/**
 * Launches native dialogs for generating a certificate. This will create a cert and private key and then will convert them into a pfx file.
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
			// TODO Use generate method instead? There are very slight difference between the script and generate function
			appc.subprocess.getRealName(path.resolve(__dirname, '..', 'bin', 'winstore_create_cert.ps1'), function (err, psScript) {
				if (err) {
					emitter.emit('error', err);
					return callback(err);
				}

				// first lets create the cert
				appc.subprocess.run(vsInfo.vcvarsall.replace(/\ /g, '^ '), [
					'&&',
					options.powershell || 'powershell',
					'-ExecutionPolicy', 'Bypass', '-NoLogo', '-NonInteractive', '-NoProfile',
					'-File', psScript,
					appid,
					moment().add(2, 'years').format('L'),
					'"' + certPath + '"'
				], function (code, out, err) {
					if (code) {
						var ex = new Error(__('Failed to create certificate (code %s)', code));
						emitter.emit('error', ex);
						return callback(ex);
					}

					generatePFX(certPath + '.pvk', certPath + '.cer', certPath + '.pfx', options, function(err, pfxFile) {
						if (err) {
							emitter.emit('error', err);
							callback(err);
						} else {
							// Once generated, remove the private key and cert
							fs.existsSync(certPath + '.pvk') && fs.unlinkSync(certPath + '.pvk');
							fs.existsSync(certPath + '.cer') && fs.unlinkSync(certPath + '.cer');

							emitter.emit('created', pfxFile);
							callback(null, pfxFile);
						}
					});
				});
			});
		});
	});
}


/**
 * Returns the thumbprint for a certificate/PFX file
 *
 * @param {String} certificateFile - The path where the certificate/pfx file lives.
 * @param {String} password - The password for the certificate/pfx file.
 * @param {Function} [callback(err, thumbprint)] - A function to call after the thumbprint has been extracted.
 */
function thumbprint(certificateFile, password, callback) {
	if (!password) {
		password = '""';
	} 
	exec('certutil -p ' + password + ' -dump "' + certificateFile + '"', function (code, out, err) {
		if (code) {
			callback(err);
		}
		else if (out.indexOf('The system cannot find the file specified.') >= 0) {
			callback(new Error('No certificate was found at the path: "' + certificateFile + '"'));
		}
		else {
			callback(null, out.split('Cert Hash(sha1): ')[1].split('\r')[0].split(' ').join('').toUpperCase());
		}
	});
}

/**
 * Generates a self-signed cert and private key pair.
 *
 * @param {String} subjectName - The subject name to use in the cert.
 * @param {String} destinationDir - The path where the certificate and private key will be created.
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.makeCert='MakeCert'] - The path to the 'makecert' executable.
 * @param {Function} [callback(err, privateKeyFile, certificateFile)] - A function to call after the private key and certificate have been created.
 *
 * @emits module:certs#created
 * @emits module:certs#error
 *
 * @returns {EventEmitter}
 */
function generate(subjectName, certificateFile, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (typeof subjectName !== 'string' || !subjectName) {
			var ex = new Error(__('Missing required "%s" argument', 'subjectName'));
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

			var vsInfo = results.selectedVisualStudio,
				pvk = certPath + '.pvk',
				cer = certPath + '.cer',
				expirationDate = moment().add(2, 'years').format('L'),
				args = [];

			if (!vsInfo) {
				var ex = new Error(__('Unable to find a supported Visual Studio installation'));
				emitter.emit('error', ex);
				return callback(ex);
			}

			args = [
				'&&', options.makeCert || 'MakeCert',
				'-n', subjectName, '-r', '-h', '0', '-eku', '1.3.6.1.5.5.7.3.3,1.3.6.1.4.1.311.10.3.13',
				'-e', expirationDate, '-sv', pvk, cer
			];

			appc.subprocess.run(vsInfo.vcvarsall, args, function (code, out, err) {
				if (code) {
					var ex = new Error(__('Failed to create certificate (code %s)', code));
					emitter.emit('error', ex);
					return callback(ex);
				} else {
					emitter.emit('created', certPath + '.cer');
					callback(null, certPath + '.pvk', certPath + '.cer');
				}
			});
		});
	});
}

/**
 * Launches native dialogs for generating a certificate.
 *
 * @param {String} privateKeyFile - The path where the private key (pvk) file lives.
 * @param {String} certificateFile - The path where the certificate (cer) file lives.
 * @param {String} pfxDestinationFile - The path where the PFX file will be created.
 * @param {String} [password] - The password for the pfx
 * @param {Object} [options] - An object containing various settings.
 * @param {String} [options.powershell='powershell'] - Path to the 'powershell' executable.
 * @param {String} [options.pvk2pfx='Pvk2Pfx'] - The path to the 'pvk2pfx' executable.
 * @param {Function} [callback(err, pfxDestinationFile)] - A function to call after the PFX has been created.
 *
 * @emits module:certs#created
 * @emits module:certs#error
 *
 * @returns {EventEmitter}
 */
function generatePFX(privateKeyFile, certificateFile, pfxDestinationFile, password, options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		if (typeof privateKeyFile !== 'string' || !privateKeyFile) {
			var ex = new Error(__('Missing required "%s" argument', 'privateKeyFile'));
			emitter.emit('error', ex);
			return callback(ex);
		}

		if (typeof certificateFile !== 'string' || !certificateFile) {
			var ex = new Error(__('Missing required "%s" argument', 'certificateFile'));
			emitter.emit('error', ex);
			return callback(ex);
		}

		if (typeof pfxDestinationFile !== 'string' || !pfxDestinationFile) {
			var ex = new Error(__('Missing required "%s" argument', 'pfxDestinationFile'));
			emitter.emit('error', ex);
			return callback(ex);
		}

		var destDir = path.dirname(pfxDestinationFile);

		if (!fs.existsSync(destDir)) {
			wrench.mkdirSyncRecursive(destDir);
		}

		visualstudio.detect(options, function (err, results) {
			if (err) {
				emitter.emit('error', err);
				return callback(err);
			}

			var vsInfo = results.selectedVisualStudio,
				args = [];

			if (!vsInfo) {
				var ex = new Error(__('Unable to find a supported Visual Studio installation'));
				emitter.emit('error', ex);
				return callback(ex);
			}

			args = [
				'&&', options.pvk2pfx || 'Pvk2Pfx',
				'/pvk', privateKeyFile,
				'/spc', certificateFile,
				'/pfx', pfxDestinationFile
			];
			if (password && password !== '') {
				args.push('/pi');
				args.push(password);
			}

			// package the certificate as pfx
			appc.subprocess.run(vsInfo.vcvarsall, args, function (code, out, err) {
				if (code) {
					var ex = new Error(__('Failed to convert certificate to pfx (code %s)', code));
					emitter.emit('error', ex);
					callback(ex);
				} else {
					emitter.emit('created', pfxDestinationFile);
					callback(null, pfxDestinationFile);
				}
			});
		});
	});
}