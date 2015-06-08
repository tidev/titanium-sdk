/**
 * Detects iOS developer and distribution certificates and the WWDC certificate.
 *
 * @module certs
 *
 * @copyright
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc.
 * {@link https://github.com/digitalbazaar/forge}
 *
 * @license
 * Licensed under the terms of the Apache Public License.
 * Please see the LICENSE included with this distribution for details.
 */

const
	appc = require('node-appc'),
	async = require('async'),
	env = require('./env'),
	magik = require('./utilities').magik,
	__ = appc.i18n(__dirname).__;

var cache = null,
	watchers = {},
	watchResults = null,
	watchInterval = 60000,
	watchTimer = null;

exports.detect = detect;
exports.watch = watch;
exports.unwatch = unwatch;

/**
 * Detects installed certificates.
 *
 * @param {Object} [options] - An object containing various settings.
 * @param {Boolean} [options.bypassCache=false] - When true, re-detects all certificates.
 * @param {Boolean} [options.validOnly=true] - When true, only returns non-expired, valid certificates.
 * @param {Function} [callback(err, results)] - A function to call with the certificate information.
 *
 * @emits module:certs#detected
 * @emits module:certs#error
 *
 * @returns {EventEmitter}
 */
function detect(options, callback) {
	return magik(options, callback, function (emitter, options, callback) {
		var validOnly = options.validOnly === undefined || options.validOnly === true;

		if (cache && !options.bypassCache) {
			emitter.emit('detected', cache);
			return callback(null, cache);
		}

		function getCerts(cb) {
			// detect the development environment
			env.detect(options, function (err, env) {
				var results = {
					certs: {
						keychains: {},
						wwdr: false
					},
					issues: []
				};

				// if we don't have the security executable, we cannot detect certs
				if (!env.executables.security) {
					return cb(null, results);
				}

				appc.subprocess.run(env.executables.security, 'list-keychains', function (code, out, err) {
					if (code) {
						return cb(results);
					}

					function parseCerts(src, dest, name) {
						var p = 0,
							q = src.indexOf('-----END'),
							pem, cert, validity, expired, invalid, commonName;

						while (p !== -1 && q !== -1) {
							pem = src.substring(p, q + 25);
							cert = pem2cert(pem);
							expired = cert.validity.notAfter < now,
							invalid = expired || cert.validity.notBefore > now;
							commonName = cert.subject.getField('CN').value;

							if (!validOnly || !invalid) {
								dest.push({
									name: appc.encoding.decodeOctalUTF8(name ? commonName.substring(name.length) : commonName).trim(),
									fullname: appc.encoding.decodeOctalUTF8(commonName).trim(),
									pem: pem,
									before: cert.validity.notBefore,
									after: cert.validity.notAfter,
									expired: expired,
									invalid: invalid
								});
							}

							p = src.indexOf('-----BEGIN', q + 25);
							q = src.indexOf('-----END', p);
						}
					}

					var now = new Date,
						tasks = [];

					// parse out the keychains and add tasks to find certs for each keychain
					out.split('\n').forEach(function (line) {
						var m = line.match(/[^"]*"([^"]*)"/);
						if (!m) return;

						var keychain = m[1].trim(),
							dest = results.certs.keychains[keychain] = {
								developer: [],
								distribution: []
							};

						// find all the developer certificates in this keychain
						tasks.push(function (next) {
							appc.subprocess.run(env.executables.security, ['find-certificate', '-c', 'iPhone Developer:', '-a', '-p', keychain], function (code, out, err) {
								if (!code) {
									parseCerts(out, dest.developer, 'iPhone Developer:');
								}
								next();
							});
						});

						// find all the developer certificates in this keychain
						tasks.push(function (next) {
							appc.subprocess.run(env.executables.security, ['find-certificate', '-c', 'iOS Development:', '-a', '-p', keychain], function (code, out, err) {
								if (!code) {
									parseCerts(out, dest.developer, 'iOS Development:');
								}
								next();
							});
						});

						// find all the distribution certificates in this keychain
						tasks.push(function (next) {
							appc.subprocess.run(env.executables.security, ['find-certificate', '-c', 'iPhone Distribution:', '-a', '-p', keychain], function (code, out, err) {
								if (!code) {
									parseCerts(out, dest.distribution, 'iPhone Distribution:');
								}
								next();
							});
						});

						// find all the distribution certificates in this keychain
						tasks.push(function (next) {
							appc.subprocess.run(env.executables.security, ['find-certificate', '-c', 'iOS Distribution:', '-a', '-p', keychain], function (code, out, err) {
								if (!code) {
									parseCerts(out, dest.distribution, 'iOS Distribution:');
								}
								next();
							});
						});

						// find all the wwdr certificates in this keychain
						tasks.push(function (next) {
							// if we already found it, then skip the remaining keychains
							if (results.certs.wwdr) return next();

							appc.subprocess.run(env.executables.security, ['find-certificate', '-c', 'Apple Worldwide Developer Relations Certification Authority', '-a', '-p', keychain], function (code, out, err) {
								if (!code) {
									var tmp = [];
									parseCerts(out, tmp);
									results.certs.wwdr = tmp.length && tmp[0].invalid === false;
								}
								next();
							});
						});
					});

					// process all cert tasks
					async.parallel(tasks, function () {
						cb(results);
					});
				});
			});
		}

		// get all keychains and certs
		getCerts(function (results) {
			detectIssues(results);
			cache = results;
			emitter.emit('detected', results);
			callback(null, results);
		});
	});
};

function detectIssues(dest) {
	dest.issues = [];

	if (!dest.certs.wwdr) {
		dest.issues.push({
			id: 'IOS_NO_WWDR_CERT_FOUND',
			type: 'error',
			message: __('Apple’s World Wide Developer Relations (WWDR) intermediate certificate is not installed.') + '\n' +
				__('This will prevent you from building apps for iOS devices or package for distribution.')
		});
	}

	if (!Object.keys(dest.certs.keychains).length) {
		// I don't think this is even possible
		dest.issues.push({
			id: 'IOS_NO_KEYCHAINS_FOUND',
			type: 'warning',
			message: __('Unable to find any keychains found.')
		});
	}

	var validDevCerts = 0,
		validDistCerts = 0;

	Object.keys(dest.certs.keychains).forEach(function (keychain) {
		validDevCerts += (dest.certs.keychains[keychain].developer || []).filter(function (c) {
			return !c.invalid;
		}).length;

		validDistCerts += (dest.certs.keychains[keychain].distribution || []).filter(function (c) {
			return !c.invalid;
		}).length;
	});

	if (!validDevCerts) {
		dest.issues.push({
			id: 'IOS_NO_VALID_DEV_CERTS_FOUND',
			type: 'warning',
			message: __('Unable to find any valid iOS developer certificates.') + '\n' +
				__('This will prevent you from building apps for iOS devices.')
		});
	}

	if (!validDistCerts) {
		dest.issues.push({
			id: 'IOS_NO_VALID_DIST_CERTS_FOUND',
			type: 'warning',
			message: __('Unable to find any valid iOS production distribution certificates.') + '\n' +
				__('This will prevent you from packaging apps for distribution.')
		});
	}
}

/**
 * Watches for new and changed certificates.
 *
 * @param {Object} [options] - An object containing various settings
 * @param {Boolean} [options.watchInterval=60000] - The number of milliseconds to wait before checking for cert updates
 * @param {Function} [callback(err, results)] - A function to call with the certificate information
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

	watchers[callback] = (watchers[callback] || 0) + 1;
	watchInterval = ~~options.watchInterval || 60000;

	// check if already watching or already watching
	if (watchers[callback] === 1 && !watchTimer) {
		options.bypassCache = true;

		function check() {
			detect(options, function (err, results) {
				if (!err && (!watchResults || JSON.stringify(watchResults) !== JSON.stringify(results))) {
					watchResults = results;
					callback(null, results);
				}
				watchTimer = setTimeout(check, watchInterval);
			});
		}

		watchTimer = setTimeout(check, watchInterval);
	}

	return function () {
		unwatch(callback);
	};
};

/**
 * Stops watching for certificate changes.
 */
function unwatch(callback) {
	if (!watchers[callback]) return;

	if (--watchers[callback] <= 0) {
		delete watchers[callback];
	}

	if (!Object.keys(watchers).length) {
		clearTimeout(watchTimer);
		watchTimer = null;
	}
};

/*
 * Everything from this point onward is from the forge project (aka node-forge).
 * https://github.com/digitalbazaar/forge
 *
 * New BSD License (3-clause)
 * Copyright (c) 2010, Digital Bazaar, Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Digital Bazaar, Inc. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL DIGITAL BAZAAR BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var typeRegExp = /^(?:X509 |TRUSTED )?CERTIFICATE$/,
	rMessage = /\s*-----BEGIN ([A-Z0-9- ]+)-----\r?\n?([\x21-\x7e\s]+?(?:\r?\n\r?\n))?([:A-Za-z0-9+\/=\s]+?)-----END \1-----/g,
	rHeader = /([\x21-\x7e]+):\s*([\x21-\x7e\s^:]+)/,
	rCRLF = /\r?\n/,
	whitespaceRegExp = /\s/,
	leadingSpaceRegExp = /^\s+/,
	asn1Class = {
		UNIVERSAL:        0x00,
		APPLICATION:      0x40,
		CONTEXT_SPECIFIC: 0x80,
		PRIVATE:          0xC0
	},
	asn1Type = {
		NONE:             0,
		BOOLEAN:          1,
		INTEGER:          2,
		BITSTRING:        3,
		OCTETSTRING:      4,
		NULL:             5,
		OID:              6,
		ODESC:            7,
		EXTERNAL:         8,
		REAL:             9,
		ENUMERATED:      10,
		EMBEDDED:        11,
		UTF8:            12,
		ROID:            13,
		SEQUENCE:        16,
		SET:             17,
		PRINTABLESTRING: 19,
		IA5STRING:       22,
		UTCTIME:         23,
		GENERALIZEDTIME: 24,
		BMPSTRING:       30
	},
	x509CertificateValidator = {
		name: 'Certificate',
		tagClass: asn1Class.UNIVERSAL,
		type: asn1Type.SEQUENCE,
		constructed: true,
		value: [ {
			name: 'Certificate.TBSCertificate',
			tagClass: asn1Class.UNIVERSAL,
			type: asn1Type.SEQUENCE,
			constructed: true,
			captureAsn1: 'tbsCertificate',
			value: [ {
				name: 'Certificate.TBSCertificate.version',
				tagClass: asn1Class.CONTEXT_SPECIFIC,
				type: 0,
				constructed: true,
				optional: true,
				value: [ {
					name: 'Certificate.TBSCertificate.version.integer',
					tagClass: asn1Class.UNIVERSAL,
					type: asn1Type.INTEGER,
					constructed: false,
					capture: 'certVersion'
				} ]
			}, {
				name: 'Certificate.TBSCertificate.serialNumber',
				tagClass: asn1Class.UNIVERSAL,
				type: asn1Type.INTEGER,
				constructed: false,
				capture: 'certSerialNumber'
			}, {
				name: 'Certificate.TBSCertificate.signature',
				tagClass: asn1Class.UNIVERSAL,
				type: asn1Type.SEQUENCE,
				constructed: true,
				value: [ {
					name: 'Certificate.TBSCertificate.signature.algorithm',
					tagClass: asn1Class.UNIVERSAL,
					type: asn1Type.OID,
					constructed: false,
					capture: 'certinfoSignatureOid'
				}, {
					name: 'Certificate.TBSCertificate.signature.parameters',
					tagClass: asn1Class.UNIVERSAL,
					optional: true,
					captureAsn1: 'certinfoSignatureParams'
				} ]
			}, {
				name: 'Certificate.TBSCertificate.issuer',
				tagClass: asn1Class.UNIVERSAL,
				type: asn1Type.SEQUENCE,
				constructed: true,
				captureAsn1: 'certIssuer'
			}, {
				name: 'Certificate.TBSCertificate.validity',
				tagClass: asn1Class.UNIVERSAL,
				type: asn1Type.SEQUENCE,
				constructed: true,
				// Note: UTC and generalized times may both appear so the capture
				// names are based on their detected order, the names used below
				// are only for the common case, which validity time really means
				// "notBefore" and which means "notAfter" will be determined by order
				value: [ {
					// notBefore (Time) (UTC time case)
					name: 'Certificate.TBSCertificate.validity.notBefore (utc)',
					tagClass: asn1Class.UNIVERSAL,
					type: asn1Type.UTCTIME,
					constructed: false,
					optional: true,
					capture: 'certValidity1UTCTime'
				}, {
					// notBefore (Time) (generalized time case)
					name: 'Certificate.TBSCertificate.validity.notBefore (generalized)',
					tagClass: asn1Class.UNIVERSAL,
					type: asn1Type.GENERALIZEDTIME,
					constructed: false,
					optional: true,
					capture: 'certValidity2GeneralizedTime'
				}, {
					// notAfter (Time) (only UTC time is supported)
					name: 'Certificate.TBSCertificate.validity.notAfter (utc)',
					tagClass: asn1Class.UNIVERSAL,
					type: asn1Type.UTCTIME,
					constructed: false,
					optional: true,
					capture: 'certValidity3UTCTime'
				}, {
					// notAfter (Time) (only UTC time is supported)
					name: 'Certificate.TBSCertificate.validity.notAfter (generalized)',
					tagClass: asn1Class.UNIVERSAL,
					type: asn1Type.GENERALIZEDTIME,
					constructed: false,
					optional: true,
					capture: 'certValidity4GeneralizedTime'
				} ]
			}, {
				// Name (subject) (RDNSequence)
				name: 'Certificate.TBSCertificate.subject',
				tagClass: asn1Class.UNIVERSAL,
				type: asn1Type.SEQUENCE,
				constructed: true,
				captureAsn1: 'certSubject'
			}, {
				name: 'SubjectPublicKeyInfo',
				tagClass: asn1Class.UNIVERSAL,
				type: asn1Type.SEQUENCE,
				constructed: true,
				captureAsn1: 'subjectPublicKeyInfo',
				value: [ {
					name: 'SubjectPublicKeyInfo.AlgorithmIdentifier',
					tagClass: asn1Class.UNIVERSAL,
					type: asn1Type.SEQUENCE,
					constructed: true,
					value: [ {
						name: 'AlgorithmIdentifier.algorithm',
						tagClass: asn1Class.UNIVERSAL,
						type: asn1Type.OID,
						constructed: false,
						capture: 'publicKeyOid'
					} ]
				}, {
					// subjectPublicKey
					name: 'SubjectPublicKeyInfo.subjectPublicKey',
					tagClass: asn1Class.UNIVERSAL,
					type: asn1Type.BITSTRING,
					constructed: false,
					value: [ {
						// RSAPublicKey
						name: 'SubjectPublicKeyInfo.subjectPublicKey.RSAPublicKey',
						tagClass: asn1Class.UNIVERSAL,
						type: asn1Type.SEQUENCE,
						constructed: true,
						optional: true,
						captureAsn1: 'rsaPublicKey'
					} ]
				} ]
			}, {
				// issuerUniqueID (optional)
				name: 'Certificate.TBSCertificate.issuerUniqueID',
				tagClass: asn1Class.CONTEXT_SPECIFIC,
				type: 1,
				constructed: true,
				optional: true,
				value: [ {
					name: 'Certificate.TBSCertificate.issuerUniqueID.id',
					tagClass: asn1Class.UNIVERSAL,
					type: asn1Type.BITSTRING,
					constructed: false,
					capture: 'certIssuerUniqueId'
				} ]
			}, {
				// subjectUniqueID (optional)
				name: 'Certificate.TBSCertificate.subjectUniqueID',
				tagClass: asn1Class.CONTEXT_SPECIFIC,
				type: 2,
				constructed: true,
				optional: true,
				value: [ {
					name: 'Certificate.TBSCertificate.subjectUniqueID.id',
					tagClass: asn1Class.UNIVERSAL,
					type: asn1Type.BITSTRING,
					constructed: false,
					capture: 'certSubjectUniqueId'
				} ]
			}, {
				// Extensions (optional)
				name: 'Certificate.TBSCertificate.extensions',
				tagClass: asn1Class.CONTEXT_SPECIFIC,
				type: 3,
				constructed: true,
				captureAsn1: 'certExtensions',
				optional: true
			} ]
		}, {
			// AlgorithmIdentifier (signature algorithm)
			name: 'Certificate.signatureAlgorithm',
			tagClass: asn1Class.UNIVERSAL,
			type: asn1Type.SEQUENCE,
			constructed: true,
			value: [ {
				// algorithm
				name: 'Certificate.signatureAlgorithm.algorithm',
				tagClass: asn1Class.UNIVERSAL,
				type: asn1Type.OID,
				constructed: false,
				capture: 'certSignatureOid'
			}, {
				name: 'Certificate.TBSCertificate.signature.parameters',
				tagClass: asn1Class.UNIVERSAL,
				optional: true,
				captureAsn1: 'certSignatureParams'
			} ]
		}, {
			// SignatureValue
			name: 'Certificate.signatureValue',
			tagClass: asn1Class.UNIVERSAL,
			type: asn1Type.BITSTRING,
			constructed: false,
			capture: 'certSignature'
		} ]
	},
	oids = {
		// algorithm OIDs
		'1.2.840.113549.1.1.1': 'rsaEncryption',
		'rsaEncryption': '1.2.840.113549.1.1.1',
		// Note: md2 & md4 not implemented
		//'1.2.840.113549.1.1.2': 'md2WithRSAEncryption',
		//'md2WithRSAEncryption': '1.2.840.113549.1.1.2',
		//'1.2.840.113549.1.1.3': 'md4WithRSAEncryption',
		//'md4WithRSAEncryption': '1.2.840.113549.1.1.3',
		'1.2.840.113549.1.1.4': 'md5WithRSAEncryption',
		'md5WithRSAEncryption': '1.2.840.113549.1.1.4',
		'1.2.840.113549.1.1.5': 'sha1WithRSAEncryption',
		'sha1WithRSAEncryption': '1.2.840.113549.1.1.5',
		'1.2.840.113549.1.1.7': 'RSAES-OAEP',
		'RSAES-OAEP': '1.2.840.113549.1.1.7',
		'1.2.840.113549.1.1.8': 'mgf1',
		'mgf1': '1.2.840.113549.1.1.8',
		'1.2.840.113549.1.1.9': 'pSpecified',
		'pSpecified': '1.2.840.113549.1.1.9',
		'1.2.840.113549.1.1.10': 'RSASSA-PSS',
		'RSASSA-PSS': '1.2.840.113549.1.1.10',
		'1.2.840.113549.1.1.11': 'sha256WithRSAEncryption',
		'sha256WithRSAEncryption': '1.2.840.113549.1.1.11',
		'1.2.840.113549.1.1.12': 'sha384WithRSAEncryption',
		'sha384WithRSAEncryption': '1.2.840.113549.1.1.12',
		'1.2.840.113549.1.1.13': 'sha512WithRSAEncryption',
		'sha512WithRSAEncryption': '1.2.840.113549.1.1.13',

		'1.3.14.3.2.7': 'desCBC',
		'desCBC': '1.3.14.3.2.7',

		'1.3.14.3.2.26': 'sha1',
		'sha1': '1.3.14.3.2.26',
		'2.16.840.1.101.3.4.2.1': 'sha256',
		'sha256': '2.16.840.1.101.3.4.2.1',
		'2.16.840.1.101.3.4.2.2': 'sha384',
		'sha384': '2.16.840.1.101.3.4.2.2',
		'2.16.840.1.101.3.4.2.3': 'sha512',
		'sha512': '2.16.840.1.101.3.4.2.3',
		'1.2.840.113549.2.5': 'md5',
		'md5': '1.2.840.113549.2.5',

		// pkcs#7 content types
		'1.2.840.113549.1.7.1': 'data',
		'data': '1.2.840.113549.1.7.1',
		'1.2.840.113549.1.7.2': 'signedData',
		'signedData': '1.2.840.113549.1.7.2',
		'1.2.840.113549.1.7.3': 'envelopedData',
		'envelopedData': '1.2.840.113549.1.7.3',
		'1.2.840.113549.1.7.4': 'signedAndEnvelopedData',
		'signedAndEnvelopedData': '1.2.840.113549.1.7.4',
		'1.2.840.113549.1.7.5': 'digestedData',
		'digestedData': '1.2.840.113549.1.7.5',
		'1.2.840.113549.1.7.6': 'encryptedData',
		'encryptedData': '1.2.840.113549.1.7.6',

		// pkcs#9 oids
		'1.2.840.113549.1.9.1': 'emailAddress',
		'emailAddress': '1.2.840.113549.1.9.1',
		'1.2.840.113549.1.9.2': 'unstructuredName',
		'unstructuredName': '1.2.840.113549.1.9.2',
		'1.2.840.113549.1.9.3': 'contentType',
		'contentType': '1.2.840.113549.1.9.3',
		'1.2.840.113549.1.9.4': 'messageDigest',
		'messageDigest': '1.2.840.113549.1.9.4',
		'1.2.840.113549.1.9.5': 'signingTime',
		'signingTime': '1.2.840.113549.1.9.5',
		'1.2.840.113549.1.9.6': 'counterSignature',
		'counterSignature': '1.2.840.113549.1.9.6',
		'1.2.840.113549.1.9.7': 'challengePassword',
		'challengePassword': '1.2.840.113549.1.9.7',
		'1.2.840.113549.1.9.8': 'unstructuredAddress',
		'unstructuredAddress': '1.2.840.113549.1.9.8',

		'1.2.840.113549.1.9.20': 'friendlyName',
		'friendlyName': '1.2.840.113549.1.9.20',
		'1.2.840.113549.1.9.21': 'localKeyId',
		'localKeyId': '1.2.840.113549.1.9.21',
		'1.2.840.113549.1.9.22.1': 'x509Certificate',
		'x509Certificate': '1.2.840.113549.1.9.22.1',

		// pkcs#12 safe bags
		'1.2.840.113549.1.12.10.1.1': 'keyBag',
		'keyBag': '1.2.840.113549.1.12.10.1.1',
		'1.2.840.113549.1.12.10.1.2': 'pkcs8ShroudedKeyBag',
		'pkcs8ShroudedKeyBag': '1.2.840.113549.1.12.10.1.2',
		'1.2.840.113549.1.12.10.1.3': 'certBag',
		'certBag': '1.2.840.113549.1.12.10.1.3',
		'1.2.840.113549.1.12.10.1.4': 'crlBag',
		'crlBag': '1.2.840.113549.1.12.10.1.4',
		'1.2.840.113549.1.12.10.1.5': 'secretBag',
		'secretBag': '1.2.840.113549.1.12.10.1.5',
		'1.2.840.113549.1.12.10.1.6': 'safeContentsBag',
		'safeContentsBag': '1.2.840.113549.1.12.10.1.6',

		// password-based-encryption for pkcs#12
		'1.2.840.113549.1.5.13': 'pkcs5PBES2',
		'pkcs5PBES2': '1.2.840.113549.1.5.13',
		'1.2.840.113549.1.5.12': 'pkcs5PBKDF2',
		'pkcs5PBKDF2': '1.2.840.113549.1.5.12',

		'1.2.840.113549.1.12.1.1': 'pbeWithSHAAnd128BitRC4',
		'pbeWithSHAAnd128BitRC4': '1.2.840.113549.1.12.1.1',
		'1.2.840.113549.1.12.1.2': 'pbeWithSHAAnd40BitRC4',
		'pbeWithSHAAnd40BitRC4': '1.2.840.113549.1.12.1.2',
		'1.2.840.113549.1.12.1.3': 'pbeWithSHAAnd3-KeyTripleDES-CBC',
		'pbeWithSHAAnd3-KeyTripleDES-CBC': '1.2.840.113549.1.12.1.3',
		'1.2.840.113549.1.12.1.4': 'pbeWithSHAAnd2-KeyTripleDES-CBC',
		'pbeWithSHAAnd2-KeyTripleDES-CBC': '1.2.840.113549.1.12.1.4',
		'1.2.840.113549.1.12.1.5': 'pbeWithSHAAnd128BitRC2-CBC',
		'pbeWithSHAAnd128BitRC2-CBC': '1.2.840.113549.1.12.1.5',
		'1.2.840.113549.1.12.1.6': 'pbewithSHAAnd40BitRC2-CBC',
		'pbewithSHAAnd40BitRC2-CBC': '1.2.840.113549.1.12.1.6',

		// symmetric key algorithm oids
		'1.2.840.113549.3.7': 'des-EDE3-CBC',
		'des-EDE3-CBC': '1.2.840.113549.3.7',
		'2.16.840.1.101.3.4.1.2': 'aes128-CBC',
		'aes128-CBC': '2.16.840.1.101.3.4.1.2',
		'2.16.840.1.101.3.4.1.22': 'aes192-CBC',
		'aes192-CBC': '2.16.840.1.101.3.4.1.22',
		'2.16.840.1.101.3.4.1.42': 'aes256-CBC',
		'aes256-CBC': '2.16.840.1.101.3.4.1.42',

		// certificate issuer/subject OIDs
		'2.5.4.3': 'commonName',
		'commonName': '2.5.4.3',
		'2.5.4.5': 'serialName',
		'serialName': '2.5.4.5',
		'2.5.4.6': 'countryName',
		'countryName': '2.5.4.6',
		'2.5.4.7': 'localityName',
		'localityName': '2.5.4.7',
		'2.5.4.8': 'stateOrProvinceName',
		'stateOrProvinceName': '2.5.4.8',
		'2.5.4.10': 'organizationName',
		'organizationName': '2.5.4.10',
		'2.5.4.11': 'organizationalUnitName',
		'organizationalUnitName': '2.5.4.11',

		// X.509 extension OIDs
		'2.16.840.1.113730.1.1': 'nsCertType',
		'nsCertType': '2.16.840.1.113730.1.1',
		'2.5.29.1': 'authorityKeyIdentifier', // deprecated, use .35
		'2.5.29.2': 'keyAttributes', // obsolete use .37 or .15
		'2.5.29.3': 'certificatePolicies', // deprecated, use .32
		'2.5.29.4': 'keyUsageRestriction', // obsolete use .37 or .15
		'2.5.29.5': 'policyMapping', // deprecated use .33
		'2.5.29.6': 'subtreesConstraint', // obsolete use .30
		'2.5.29.7': 'subjectAltName', // deprecated use .17
		'2.5.29.8': 'issuerAltName', // deprecated use .18
		'2.5.29.9': 'subjectDirectoryAttributes',
		'2.5.29.10': 'basicConstraints', // deprecated use .19
		'2.5.29.11': 'nameConstraints', // deprecated use .30
		'2.5.29.12': 'policyConstraints', // deprecated use .36
		'2.5.29.13': 'basicConstraints', // deprecated use .19
		'2.5.29.14': 'subjectKeyIdentifier',
		'subjectKeyIdentifier': '2.5.29.14',
		'2.5.29.15': 'keyUsage',
		'keyUsage': '2.5.29.15',
		'2.5.29.16': 'privateKeyUsagePeriod',
		'2.5.29.17': 'subjectAltName',
		'subjectAltName': '2.5.29.17',
		'2.5.29.18': 'issuerAltName',
		'issuerAltName': '2.5.29.18',
		'2.5.29.19': 'basicConstraints',
		'basicConstraints': '2.5.29.19',
		'2.5.29.20': 'cRLNumber',
		'2.5.29.21': 'cRLReason',
		'2.5.29.22': 'expirationDate',
		'2.5.29.23': 'instructionCode',
		'2.5.29.24': 'invalidityDate',
		'2.5.29.25': 'cRLDistributionPoints', // deprecated use .31
		'2.5.29.26': 'issuingDistributionPoint', // deprecated use .28
		'2.5.29.27': 'deltaCRLIndicator',
		'2.5.29.28': 'issuingDistributionPoint',
		'2.5.29.29': 'certificateIssuer',
		'2.5.29.30': 'nameConstraints',
		'2.5.29.31': 'cRLDistributionPoints',
		'2.5.29.32': 'certificatePolicies',
		'2.5.29.33': 'policyMappings',
		'2.5.29.34': 'policyConstraints', // deprecated use .36
		'2.5.29.35': 'authorityKeyIdentifier',
		'2.5.29.36': 'policyConstraints',
		'2.5.29.37': 'extKeyUsage',
		'extKeyUsage': '2.5.29.37',
		'2.5.29.46': 'freshestCRL',
		'2.5.29.54': 'inhibitAnyPolicy',

		// extKeyUsage purposes
		'1.3.6.1.5.5.7.3.1': 'serverAuth',
		'serverAuth': '1.3.6.1.5.5.7.3.1',
		'1.3.6.1.5.5.7.3.2': 'clientAuth',
		'clientAuth': '1.3.6.1.5.5.7.3.2',
		'1.3.6.1.5.5.7.3.3': 'codeSigning',
		'codeSigning': '1.3.6.1.5.5.7.3.3',
		'1.3.6.1.5.5.7.3.4': 'emailProtection',
		'emailProtection': '1.3.6.1.5.5.7.3.4',
		'1.3.6.1.5.5.7.3.8': 'timeStamping',
		'timeStamping': '1.3.6.1.5.5.7.3.8'
	},
	shortNames = {
		'CN': oids['commonName'],
		'commonName': 'CN',
		'C': oids['countryName'],
		'countryName': 'C',
		'L': oids['localityName'],
		'localityName': 'L',
		'ST': oids['stateOrProvinceName'],
		'stateOrProvinceName': 'ST',
		'O': oids['organizationName'],
		'organizationName': 'O',
		'OU': oids['organizationalUnitName'],
		'organizationalUnitName': 'OU',
		'E': oids['emailAddress'],
		'emailAddress': 'E'
	};

function pem2cert(pem) {
	var msg = decodePem(pem)[0];

	if (msg.type !== 'CERTIFICATE' && msg.type !== 'X509 CERTIFICATE' && msg.type !== 'TRUSTED CERTIFICATE') {
		throw new Error(__('Could not convert certificate from PEM; PEM header type is "%s", but must be "CERTIFICATE", "X509 CERTIFICATE", or "TRUSTED CERTIFICATE".', msg.type));
	}

	if (msg.procType && msg.procType.type === 'ENCRYPTED') {
		throw new Error(__('Could not convert certificate from PEM; PEM is encrypted.'));
	}

	return asn2cert(der2asn(new ByteStringBuffer(msg.body)));
}

function decodePem(str) {
	var rval = [],
		match, msg, lines, li, line, nl, next, header, values, vi;

	while (true) {
		match = rMessage.exec(str);
		if (!match) {
			break;
		}

		rval.push(msg = {
			type: match[1],
			procType: null,
			contentDomain: null,
			dekInfo: null,
			headers: [],
			body: new Buffer(match[3], 'base64').toString('binary')
		});

		// no headers
		if (!match[2]) {
			continue;
		}

		// parse headers
		lines = match[2].split(rCRLF);
		for (li = 0; match && li < lines.length; ++li) {
			// get line, trim any rhs whitespace
			line = lines[li].replace(/\s+$/, '');

			// RFC2822 unfold any following folded lines
			for (nl = li + 1; nl < lines.length; ++nl) {
				next = lines[nl];
				if (!whitespaceRegExp.test(next[0])) {
					break;
				}
				line += next;
				li = nl;
			}

			// parse header
			match = line.match(rHeader);
			if (match) {
				header = {name: match[1], values: []};
				values = match[2].split(',');
				for (vi = 0; vi < values.length; ++vi) {
					header.values.push(values[vi].replace(leadingSpaceRegExp, ''));
				}

				// Proc-Type must be the first header
				if (!msg.procType) {
					if (header.name !== 'Proc-Type') {
						throw new Error(__('Invalid PEM formatted message. The first encapsulated header must be "Proc-Type".'));
					} else if (header.values.length !== 2) {
						throw new Error(__('Invalid PEM formatted message. The "Proc-Type" header must have two subfields.'));
					}
					msg.procType = { version: values[0], type: values[1] };

				// special-case Content-Domain
				} else if (!msg.contentDomain && header.name === 'Content-Domain') {
					msg.contentDomain = values[0] || '';

				// special-case DEK-Info
				} else if (!msg.dekInfo && header.name === 'DEK-Info') {
					if (header.values.length === 0) {
						throw new Error(__('Invalid PEM formatted message. The "DEK-Info" header must have at least one subfield.'));
					}
					msg.dekInfo = { algorithm: values[0], parameters: values[1] || null };
				} else {
					msg.headers.push(header);
				}
			}
		}

		if (msg.procType === 'ENCRYPTED' && !msg.dekInfo) {
			throw new Error(__('Invalid PEM formatted message. The "DEK-Info" header must be present if "Proc-Type" is "ENCRYPTED".'));
		}
	}

	if (rval.length === 0) {
		throw new Error(__('Invalid PEM formatted message.'));
	}

	return rval;
}

function ByteStringBuffer(str) {
	this.data = str;
	this.read = 0;
}

ByteStringBuffer.prototype.length = function length() {
	return this.data.length - this.read;
};

ByteStringBuffer.prototype.getByte = function getByte() {
	return this.data.charCodeAt(this.read++);
};

ByteStringBuffer.prototype.getInt = function getInt(n) {
	var rval = 0;
	do {
		rval = (rval << 8) + this.data.charCodeAt(this.read++);
		n -= 8;
	} while (n > 0);
	return rval;
};

ByteStringBuffer.prototype.bytes = function bytes(count) {
	return count === undefined ?
		this.data.slice(this.read) :
		this.data.slice(this.read, this.read + count);
};

ByteStringBuffer.prototype.getBytes = function getBytes(count) {
	var rval;
	if (count) {
		// read count bytes
		count = Math.min(this.length(), count);
		rval = this.data.slice(this.read, this.read + count);
		this.read += count;
	} else if (count === 0) {
		rval = '';
	} else {
		// read all bytes, optimize to only copy when needed
		rval = this.read === 0 ? this.data : this.data.slice(this.read);
		this.clear();
	}
	return rval;
};

ByteStringBuffer.prototype.getInt16 = function getInt16() {
	var rval = (this.data.charCodeAt(this.read) << 8 ^ this.data.charCodeAt(this.read + 1));
	this.read += 2;
	return rval;
};

ByteStringBuffer.prototype.clear = function clear() {
	this.data = '';
	this.read = 0;
	return this;
};

function der2asn(bytes) {
	// minimum length for ASN.1 DER structure is 2
	if (bytes.length() < 2) {
		throw new Error(__('Too few bytes to parse DER; expected at least 2, got %d', bytes.length()));
	}

	// get the first byte
	var b1 = bytes.getByte(),
		// get the tag class
		tagClass = (b1 & 0xC0),
		// get the type (bits 1-5)
		type = b1 & 0x1F,

		_getValueLength = function _getValueLength(b) {
			var b2 = b.getByte();
			if (b2 === 0x80) {
				return undefined;
			}

			// see if the length is "short form" or "long form" (bit 8 set)
			// if "long form", the number of bytes the length is specified in bits 7 through 1
			// and each length byte is in big-endian base-256
			return b2 & 0x80 ? b.getInt((b2 & 0x7F) << 3) : b2;
		},

		// get the value length
		length = _getValueLength(bytes),
		// prepare to get value
		value,
		// constructed flag is bit 6 (32 = 0x20) of the first byte
		constructed = ((b1 & 0x20) === 0x20),
		composed = constructed;

	// ensure there are enough bytes to get the value
	if (bytes.length() < length) {
		throw new Error(__('Too few bytes to read ASN.1 value. %d < %d', bytes.length(), length));
	}

	// determine if the value is composed of other ASN.1 objects (if its
	// constructed it will be and if its a BITSTRING it may be)
	if (!composed && tagClass === asn1Class.UNIVERSAL && type === asn1Type.BITSTRING && length > 1) {
		/* The first octet gives the number of bits by which the length of the
		bit string is less than the next multiple of eight (this is called
		the "number of unused bits").

		The second and following octets give the value of the bit string
		converted to an octet string. */

		// if there are no unused bits, maybe the bitstring holds ASN.1 objs
		var read = bytes.read,
			unused = bytes.getByte();

		if (unused === 0) {
			// if the first byte indicates UNIVERSAL or CONTEXT_SPECIFIC,
			// and the length is valid, assume we've got an ASN.1 object
			b1 = bytes.getByte();
			var tc = (b1 & 0xC0);
			if (tc === asn1Class.UNIVERSAL || tc === asn1Class.CONTEXT_SPECIFIC) {
				try {
					var len = _getValueLength(bytes);
					composed = (len === length - (bytes.read - read));
					if (composed) {
						// adjust read/length to account for unused bits byte
						++read;
						--length;
					}
				} catch(ex) {}
			}
		}
		// restore read pointer
		bytes.read = read;
	}

	if (composed) {
		// parse child asn1 objects from the value
		value = [];
		if (length === undefined) {
			// asn1 object of indefinite length, read until end tag
			for (;;) {
				if (bytes.bytes(2) === String.fromCharCode(0, 0)) {
					bytes.getBytes(2);
					break;
				}
				value.push(der2asn(bytes));
			}
		} else {
			// parsing asn1 object of definite length
			var start = bytes.length();
			while (length > 0) {
				value.push(der2asn(bytes));
				length -= start - bytes.length();
				start = bytes.length();
			}
		}
	} else {
	    // asn1 not composed, get raw value
	    // TODO: do DER to OID conversion and vice-versa in .toDer?

		if (length === undefined) {
			throw new Error(__('Non-constructed ASN.1 object of indefinite length.'));
		}

		if (type === asn1Type.BMPSTRING) {
			value = '';
			for (var i = 0; i < length; i += 2) {
				value += String.fromCharCode(bytes.getInt16());
			}
		} else {
			value = bytes.getBytes(length);
		}
	}

	return {
		tagClass: tagClass,
		type: type,
		constructed: constructed,
		composed: constructed || Array.isArray(value),
		value: Array.isArray(value) ? value.filter(function (v) { return v !== undefined; }) : value
	};
}

function asn1validate(obj, v, capture, errors) {
	var rval = false;

	// ensure tag class and type are the same if specified
	if ((obj.tagClass === v.tagClass || v.tagClass === undefined) && (obj.type === v.type || v.type === undefined)) {
		// ensure constructed flag is the same if specified
		if (obj.constructed === v.constructed || v.constructed === undefined) {
			rval = true;

			// handle sub values
			if (v.value && Array.isArray(v.value)) {
				var j = 0;
				for (var i = 0; rval && i < v.value.length; ++i) {
					rval = v.value[i].optional || false;
					if (obj.value[j]) {
						rval = asn1validate(obj.value[j], v.value[i], capture, errors);
						if (rval) {
							++j;
						} else if (v.value[i].optional) {
							rval = true;
						}
					}
					if (!rval && errors) {
						errors.push('[' + v.name + '] Tag class "' + v.tagClass + '", type "' + v.type + '" expected value length "' + v.value.length + '", got "' + obj.value.length + '"');
					}
				}
			}

			if (rval && capture) {
				if (v.capture) {
					capture[v.capture] = obj.value;
				}
				if (v.captureAsn1) {
					capture[v.captureAsn1] = obj;
				}
			}
		} else if (errors) {
			errors.push('[' + v.name + '] Expected constructed "' + v.constructed + '", got "' + obj.constructed + '"');
		}
	} else if (errors) {
		if (obj.tagClass !== v.tagClass) {
			errors.push('[' + v.name + '] Expected tag class "' + v.tagClass + '", got "' + obj.tagClass + '"');
		}
		if (obj.type !== v.type) {
			errors.push('[' + v.name + '] Expected type "' + v.type + '", got "' + obj.type + '"');
		}
	}
	return rval;
}

/**
 * Converts a UTCTime value to a date.
 *
 * Note: GeneralizedTime has 4 digits for the year and is used for X.509
 * dates passed 2049. Parsing that structure hasn't been implemented yet.
 *
 * @param utc the UTCTime value to convert.
 *
 * @return the date.
 */
function asn1utcTimeToDate(utc) {
	/*
	The following formats can be used:
		YYMMDDhhmmZ
		YYMMDDhhmm+hh'mm'
		YYMMDDhhmm-hh'mm'
		YYMMDDhhmmssZ
		YYMMDDhhmmss+hh'mm'
		YYMMDDhhmmss-hh'mm'

	Where:
		YY is the least significant two digits of the year
		MM is the month (01 to 12)
		DD is the day (01 to 31)
		hh is the hour (00 to 23)
		mm are the minutes (00 to 59)
		ss are the seconds (00 to 59)
		Z indicates that local time is GMT, + indicates that local time is
		later than GMT, and - indicates that local time is earlier than GMT
		hh' is the absolute value of the offset from GMT in hours
		mm' is the absolute value of the offset from GMT in minutes
	*/

	var date = new Date;

	// if YY >= 50 use 19xx, if YY < 50 use 20xx
	var year = parseInt(utc.substr(0, 2), 10);
	year = (year >= 50) ? 1900 + year : 2000 + year;
	var MM = parseInt(utc.substr(2, 2), 10) - 1; // use 0-11 for month
	var DD = parseInt(utc.substr(4, 2), 10);
	var hh = parseInt(utc.substr(6, 2), 10);
	var mm = parseInt(utc.substr(8, 2), 10);
	var ss = 0;

	// not just YYMMDDhhmmZ
	if (utc.length > 11) {
		// get character after minutes
		var c = utc.charAt(10);
		var end = 10;

		// see if seconds are present
		if (c !== '+' && c !== '-') {
			// get seconds
			ss = parseInt(utc.substr(10, 2), 10);
			end += 2;
		}
	}

	// update date
	date.setUTCFullYear(year, MM, DD);
	date.setUTCHours(hh, mm, ss, 0);

	if (end) {
		// get +/- after end of time
		c = utc.charAt(end);
		if (c === '+' || c === '-') {
			// get hours+minutes offset
			var hhoffset = parseInt(utc.substr(end + 1, 2), 10);
			var mmoffset = parseInt(utc.substr(end + 4, 2), 10);

			// calculate offset in milliseconds
			var offset = hhoffset * 60 + mmoffset;
			offset *= 60000;

			// apply offset
			if (c === '+') {
				date.setTime(+date - offset);
			} else {
				date.setTime(+date + offset);
			}
		}
	}

	return date;
}

/**
 * Converts a GeneralizedTime value to a date.
 *
 * @param gentime the GeneralizedTime value to convert.
 *
 * @return the date.
 */
function asn1generalizedTimeToDate(gentime) {
	/*
	The following formats can be used:
		YYYYMMDDHHMMSS
		YYYYMMDDHHMMSS.fff
		YYYYMMDDHHMMSSZ
		YYYYMMDDHHMMSS.fffZ
		YYYYMMDDHHMMSS+hh'mm'
		YYYYMMDDHHMMSS.fff+hh'mm'
		YYYYMMDDHHMMSS-hh'mm'
		YYYYMMDDHHMMSS.fff-hh'mm'

	Where:
		YYYY is the year
		MM is the month (01 to 12)
		DD is the day (01 to 31)
		hh is the hour (00 to 23)
		mm are the minutes (00 to 59)
		ss are the seconds (00 to 59)
		.fff is the second fraction, accurate to three decimal places
		Z indicates that local time is GMT, + indicates that local time is
		later than GMT, and - indicates that local time is earlier than GMT
		hh' is the absolute value of the offset from GMT in hours
		mm' is the absolute value of the offset from GMT in minutes
	*/

	var date = new Date,
		YYYY = parseInt(gentime.substr(0, 4), 10),
		MM = parseInt(gentime.substr(4, 2), 10) - 1, // use 0-11 for month
		DD = parseInt(gentime.substr(6, 2), 10),
		hh = parseInt(gentime.substr(8, 2), 10),
		mm = parseInt(gentime.substr(10, 2), 10),
		ss = parseInt(gentime.substr(12, 2), 10),
		fff = 0,
		offset = 0,
		isUTC = false;

	if (gentime.charAt(gentime.length - 1) === 'Z') {
		isUTC = true;
	}

	var end = gentime.length - 5,
		c = gentime.charAt(end);

	if (c === '+' || c === '-') {
		// get hours+minutes offset
		var hhoffset = parseInt(gentime.substr(end + 1, 2), 10);
		var mmoffset = parseInt(gentime.substr(end + 4, 2), 10);

		// calculate offset in milliseconds
		offset = hhoffset * 60 + mmoffset;
		offset *= 60000;

		// apply offset
		if(c === '+') {
			offset *= -1;
		}

		isUTC = true;
	}

	// check for second fraction
	if(gentime.charAt(14) === '.') {
		fff = parseFloat(gentime.substr(14), 10) * 1000;
	}

	if(isUTC) {
		date.setUTCFullYear(YYYY, MM, DD);
		date.setUTCHours(hh, mm, ss, fff);

		// apply offset
		date.setTime(+date + offset);
	} else {
		date.setFullYear(YYYY, MM, DD);
		date.setHours(hh, mm, ss, fff);
	}

	return date;
}

/**
 * Converts a DER-encoded byte buffer to an OID dot-separated string. The
 * byte buffer should contain only the DER-encoded value, not any tag or
 * length bytes.
 *
 * @param bytes the byte buffer.
 *
 * @return the OID dot-separated string.
 */
function asn1derToOid(bytes) {
	var oid;

	// wrap in buffer if needed
	if (typeof bytes === 'string') {
		bytes = new ByteStringBuffer(bytes);
	}

	// first byte is 40 * value1 + value2
	var b = bytes.getByte();
	oid = Math.floor(b / 40) + '.' + (b % 40);

	// other bytes are each value in base 128 with 8th bit set except for
	// the last byte for each value
	var value = 0;
	while (bytes.length() > 0) {
		b = bytes.getByte();
		value = value << 7;
		// not the last byte for the value
		if (b & 0x80) {
			value += b & 0x7F;
		} else {
			// last byte
			oid += '.' + (value + b);
			value = 0;
		}
	}

	return oid;
}

/**
 * Converts an RDNSequence of ASN.1 DER-encoded RelativeDistinguishedName
 * sets into an array with objects that have type and value properties.
 *
 * @param rdn the RDNSequence to convert.
 * @param md a message digest to append type and value to if provided.
 */
function pkiRDNAttributesAsArray(rdn, md) {
	// each value in 'rdn' in is a SET of RelativeDistinguishedName
	var rval = [],
		si, i, set, attr, obj;
	for (si = 0; si < rdn.value.length; ++si) {
		// get the RelativeDistinguishedName set
		set = rdn.value[si];

		// each value in the SET is an AttributeTypeAndValue sequence
		// containing first a type (an OID) and second a value (defined by
		// the OID)
		for (i = 0; i < set.value.length; ++i) {
			obj = {};
			attr = set.value[i];
			obj.type = asn1derToOid(attr.value[0].value);
			obj.value = attr.value[1].value;
			obj.valueTagClass = attr.value[1].type;
			// if the OID is known, get its name and short name
			if (obj.type in oids) {
				obj.name = oids[obj.type];
				if (obj.name in shortNames) {
					obj.shortName = shortNames[obj.name];
				}
			}
			if (md) {
				md.update(obj.type);
				md.update(obj.value);
			}
			rval.push(obj);
		}
	}

	return rval;
}

function asn2cert(obj) {
	// validate certificate and capture data
	var capture = {},
		errors = [];

	if (!asn1validate(obj, x509CertificateValidator, capture, errors)) {
		var error = new Error(__('Cannot read X.509 certificate. ASN.1 object is not an X509v3 Certificate.'));
		error.errors = errors;
		throw error;
	}

	function _getAttribute(obj, options) {
		if (typeof options === 'string') {
			options = { shortName: options };
		}
		var rval = null,
			attr;
		for (var i = 0; rval === null && i < obj.attributes.length; ++i) {
			attr = obj.attributes[i];
			if (options.type && options.type === attr.type) {
				rval = attr;
			} else if (options.name && options.name === attr.name) {
				rval = attr;
			} else if (options.shortName && options.shortName === attr.shortName) {
				rval = attr;
			}
		}
		return rval;
	}

	var subject = {
			attributes: pkiRDNAttributesAsArray(capture.certSubject),
			getField: function (sn) {
				return _getAttribute(subject, sn);
			}
		},
		validity = [];

	if (capture.certValidity1UTCTime !== undefined) {
		validity.push(asn1utcTimeToDate(capture.certValidity1UTCTime));
	}
	if (capture.certValidity2GeneralizedTime !== undefined) {
		validity.push(asn1generalizedTimeToDate(capture.certValidity2GeneralizedTime));
	}
	if (capture.certValidity3UTCTime !== undefined) {
		validity.push(asn1utcTimeToDate(capture.certValidity3UTCTime));
	}
	if (capture.certValidity4GeneralizedTime !== undefined) {
		validity.push(asn1generalizedTimeToDate(capture.certValidity4GeneralizedTime));
	}
	if (validity.length > 2) {
		throw new Error(__('Cannot read notBefore/notAfter validity times; more than two times were provided in the certificate.'));
	}
	if (validity.length < 2) {
		throw new Error(__('Cannot read notBefore/notAfter validity times; they were not provided as either UTCTime or GeneralizedTime.'));
	}

	return {
		validity: {
			notBefore: validity[0],
			notAfter: validity[1]
		},
		subject: subject
	};
}

/*
 * If the app exits, close all filesystem watchers.
 */
process.on('exit', function () {
	if (watchTimer) {
		clearTimeout(watchTimer);
		watchTimer = null;
	}
});