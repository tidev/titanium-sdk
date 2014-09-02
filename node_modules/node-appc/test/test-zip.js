/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	assert = require('assert'),
	fs = require('fs'),
	path = require('path'),
	temp = require('temp');

describe('zip', function () {
	it('namespace exists', function () {
		appc.should.have.property('zip');
		appc.zip.should.be.an.Object;
	});

	describe('#extractAll()', function () {
		it('should extract all files with correct permissions', function (done) {
			var tempDir = temp.mkdirSync();
			appc.zip.unzip(path.join(__dirname, 'resources', 'test.zip'), tempDir, null, function (err) {
				assert(!err, 'expected unzip to not error');

				fs.existsSync(path.join(tempDir, 'main.m')).should.be.ok;
				(fs.statSync(path.join(tempDir, 'main.m')).mode & 0777).should.equal(process.platform == 'win32' ? 0666 : 0644);

				fs.existsSync(path.join(tempDir, 'ios-sim')).should.be.ok;
				(fs.statSync(path.join(tempDir, 'ios-sim')).mode & 0777).should.equal(process.platform == 'win32' ? 0666 : 0755);

				done();
			});
		});
	});
});
