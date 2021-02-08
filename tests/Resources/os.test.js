/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env node, titanium, mocha */
/* eslint no-unused-expressions: "off" */
/* eslint node/no-unsupported-features/node-builtins: "off" */
'use strict';
const should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars
const utilities = require('./utilities/utilities');
let os;

describe('os', function () {
	it('should be required as core module', function () {
		os = require('os');
		should(os).be.an.Object();
	});

	it('.EOL', () => {
		should(os).have.a.property('EOL').which.is.a.String();
		// TODO: Validate \n or \r\n based on platform!
	});

	describe('#arch()', () => {
		it('is a function', function () {
			should(os.arch).be.a.Function();
		});

		it('returns a String', function () {
			should(os.arch()).be.a.String();
		});

		// node values: 'arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', 'x32', and 'x64'.
		// iOS values: "arm64", "armv7", "x86_64", "i386", "Unknown"
		// Android values: "armeabi", "armeabi-v7a", "arm64-v8a", "x86", "x86_64", "mips", "mips64", "unknown"
		// Windows values: "x64", "ia64", "ARM", "x86", "unknown"
	});

	describe('.constants', () => {
		it('is an Object', () => {
			should(os).have.a.property('constants').which.is.an.Object();
		});

		it('has a signals property which is an Object', () => {
			should(os.constants).have.a.property('signals').which.is.an.Object();
		});

		it('has a errno property which is an Object', () => {
			should(os.constants).have.a.property('errno').which.is.an.Object();
		});

		it('has a priority property which is an Object', () => {
			should(os.constants).have.a.property('priority').which.is.an.Object();
		});
	});

	describe('#cpus()', () => {
		it('is a function', () => {
			should(os.cpus).be.a.Function();
		});

		it('returns array of objects whose length matches Ti.Platform.processorCount', () => {
			const cpus = os.cpus();
			should(cpus).be.an.Array();
			should(cpus).have.length(Ti.Platform.processorCount);
			// TODO: test that the elements are objects with properties: 'model', 'speed', 'times'
		});
	});

	describe('#endianness()', () => {
		it('is a function', () => {
			should(os.endianness).be.a.Function();
		});

		it('returns "LE" or "BE", value is consistent with Ti.Codec#getNativeByteOrder()', () => {
			const byteOrder = os.endianness();
			if (Ti.Codec.getNativeByteOrder() === Ti.Codec.BIG_ENDIAN) {
				should(byteOrder).eql('BE');
			} else {
				should(byteOrder).eql('LE');
			}
		});
	});

	describe('#freemem()', () => {
		it('is a function', () => {
			should(os.freemem).be.a.Function();
		});

		it('returns a positive Number', () => {
			should(os.freemem()).be.above(0);
		});
	});

	describe('#getPriority()', () => {
		it('is a function', () => {
			should(os.getPriority).be.a.Function();
		});

		it('returns 0', () => {
			should(os.getPriority()).eql(0);
		});
	});

	describe('#homedir()', () => {
		it('is a function', () => {
			should(os.homedir).be.a.Function();
		});

		it('returns Ti.Filesystem.applicationDataDirectory value', () => {
			should(os.homedir()).eql(Ti.Filesystem.applicationDataDirectory);
		});
	});

	describe('#hostname()', () => {
		it('is a function', () => {
			should(os.hostname).be.a.Function();
		});

		it('returns Ti.Platform.address value', () => {
			// mey be undefined on iOS now!
			should(os.hostname()).eql(Ti.Platform.address);
		});
	});

	describe('#loadavg()', () => {
		it('is a function', () => {
			should(os.loadavg).be.a.Function();
		});

		it('returns [0, 0, 0]', () => {
			should(os.loadavg()).eql([ 0, 0, 0 ]);
		});
	});

	describe('#networkInterfaces()', () => {
		it('is a function', () => {
			should(os.networkInterfaces).be.a.Function();
		});

		// TODO: Implement in some way?
		// it('returns ...', () => {
		// 	should(os.networkInterfaces()).eql([ 0, 0, 0 ]);
		// });
	});

	describe('#platform()', () => {
		it('is a function', () => {
			should(os.platform).be.a.Function();
		});

		it('returns process.platform value', () => {
			should(os.platform()).eql(process.platform);
		});
	});

	describe('#release()', () => {
		it('is a function', () => {
			should(os.release).be.a.Function();
		});

		it('returns Ti.Platform.version value', () => {
			should(os.release()).eql(Ti.Platform.version);
		});
	});

	describe('#setPriority()', () => {
		it('is a function', () => {
			should(os.setPriority).be.a.Function();
		});

		it('doesn\'t blow up when called (but is no-op)', () => {
			should(function () {
				os.setPriority(0, 12);
			}).not.throw();
		});
	});

	describe('#tmpdir()', () => {
		it('is a function', () => {
			should(os.tmpdir).be.a.Function();
		});

		it('returns Ti.Filesystem.tempDirectory value', () => {
			should(os.tmpdir()).eql(Ti.Filesystem.tempDirectory);
		});
	});

	describe('#totalmem()', () => {
		it('is a function', () => {
			should(os.totalmem).be.a.Function();
		});

		it('returns a positive Number', () => {
			should(os.totalmem()).be.above(0);
			// TODO: verify it's above freemem?
		});
	});

	describe('#type()', () => {
		it('is a function', () => {
			should(os.type).be.a.Function();
		});

		it('returns a String', () => {
			should(os.type()).be.a.String(); // what values make sense here? We're coercing to node style values now, and I think that's probably wrong
			// 'Linux', 'Windows_NT', or 'Darwin'!
		});
	});

	describe('#uptime()', () => {
		it('is a function', () => {
			should(os.uptime).be.a.Function();
		});

		it('returns a positive Number', () => {
			// FIXME: Windows returns 0
			if (utilities.isWindows()) {
				should(os.uptime()).eql(0);
			} else {
				should(os.uptime()).be.above(0);
			}
		});
	});

	describe('#userInfo()', () => {
		it('is a function', () => {
			should(os.userInfo).be.a.Function();
		});

		it('returns an Object', () => {
			const userInfo = os.userInfo();
			should(userInfo).be.an.Object();
			should(userInfo).have.a.property('uid').which.eql(-1);
			should(userInfo).have.a.property('gid').which.eql(-1);
			should(userInfo).have.a.property('username').which.is.a.String(); // "iPhone 7 Plus" on ios Simulator, "android-build" on android emulator
			should(userInfo).have.a.property('homedir').which.eql(os.homedir());
			should(userInfo).have.a.property('shell').which.eql(null);
		});
	});
});
