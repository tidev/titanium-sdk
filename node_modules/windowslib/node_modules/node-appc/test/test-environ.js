/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	assert = require('assert'),
	fs = require('fs'),
	path = require('path');

describe('environ', function () {
	it('namespace exists', function () {
		appc.should.have.property('environ');
		appc.environ.should.be.an.Object;
	});

	describe('#scanCommands()', function () {
		it('should find the test command', function () {
			var dest = {},
				searchPath = path.join(__dirname, 'resources', 'environ', 'commands'),
				testModule = path.join(searchPath, 'test'),
				testFile = path.join(searchPath, 'test.js');

			appc.environ.scanCommands(dest, searchPath);

			dest.should.have.property(testModule);
			dest[testModule].should.equal(testFile);
		});

		it('should find the test command', function () {
			var dest = {},
				searchPath = path.join(__dirname, 'resources', 'environ', 'commands'),
				hiddenModule = path.join(searchPath, '_hidden');

			appc.environ.scanCommands(dest, searchPath);

			dest.should.not.have.property(hiddenModule);
		});
	});

	describe('#getSDK()', function () {
		it('should return a Titanium SDK or null', function () {
			var result = appc.environ.getSDK();
			if (result) {
				result.should.be.an.Object;
				result.should.have.property('commands');
				result.commands.should.be.an.Object;
				result.should.have.property('name');
				result.name.should.be.a.String;
				result.name.should.be.ok;
				result.should.have.property('path');
				result.path.should.be.a.String;
				result.path.should.be.ok;
				fs.existsSync(result.path).should.be.ok;
				result.should.have.property('platforms');
				result.platforms.should.be.an.Object;
			} else {
				assert.equal(result, null);
			}
		});
	});

	describe('#detectTitaniumSDKs()', function () {
		it('should detect installed Titanium SDKs', function () {
			appc.environ.detectTitaniumSDKs();
			if (Object.keys(appc.environ.sdks).length) {
				Object.keys(appc.environ.sdks).forEach(function (ver) {
					appc.environ.sdks[ver].should.be.an.Object;

					appc.environ.sdks[ver].commands.should.be.an.Object;

					appc.environ.sdks[ver].name.should.be.a.String;
					appc.environ.sdks[ver].name.should.be.ok;

					appc.environ.sdks[ver].path.should.be.a.String;
					appc.environ.sdks[ver].path.should.be.ok;

					fs.existsSync(appc.environ.sdks[ver].path).should.be.ok;
					appc.environ.sdks[ver].should.have.property('platforms');
					appc.environ.sdks[ver].platforms.should.be.an.Object;
				});
			}
		});
	});

	describe('#getOSInfo()', function () {
		it('should find OS and Node.js info', function (done) {
			appc.environ.getOSInfo(function (results) {
				results.should.be.an.Object;
				results.os.should.be.a.String;
				results.platform.should.be.a.String;
				results.osver.should.be.a.String;
				results.ostype.should.be.a.String;
				results.oscpu.should.be.a.Number;
				results.memory.should.be.a.Number;
				results.node.should.be.a.String;
				results.npm.should.be.a.String;
				done();
			});
		});

		it('should return cached info on subsequent calls', function (done) {
			appc.environ.getOSInfo(function (result1) {
				appc.environ.getOSInfo(function (result2) {
					result1.should.equal(result2);
					done();
				});
			});
		});
	});
});
