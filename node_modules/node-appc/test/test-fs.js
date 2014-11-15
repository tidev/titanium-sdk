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
	temp = require('temp'),
	wrench = require('wrench');

function MockLogger() {
	this.buffer = '';
	this.debug = function (s) { this.buffer += s + '\n'; };
	this.info = function (s) { this.buffer += s + '\n'; };
	this.warn = function (s) { this.buffer += s + '\n'; };
	this.error = function (s) { this.buffer += s + '\n'; };
}

describe('fs', function () {
	it('namespace exists', function () {
		appc.should.have.property('fs');
		appc.fs.should.be.an.Object;
	});

	describe('#copyFileSync()', function () {
		it('copy file to file with existing directory', function () {
			var logger = new MockLogger,
				src = path.join(__dirname, 'resources', 'testfile.txt'),
				dest = path.join(temp.mkdirSync(), 'testfile.txt');
			appc.fs.copyFileSync(src, dest, { logger: logger.info.bind(logger) });
			logger.buffer.stripColors.should.equal('Copying ' + src + ' => ' + dest + '\n');
			assert(fs.existsSync(dest), 'Destination file does not exist');
		});

		it('copy file to file with non-existent directory', function () {
			var logger = new MockLogger,
				src = path.join(__dirname, 'resources', 'testfile.txt'),
				dest = path.join(temp.mkdirSync(), 'test', 'testfile.txt');
			appc.fs.copyFileSync(src, dest, { logger: logger.info.bind(logger) });
			logger.buffer.stripColors.should.equal('Copying ' + src + ' => ' + dest + '\n');
			assert(fs.existsSync(dest), 'Destination file does not exist');
		});

		it('copy file to /tmp', function () {
			var logger = new MockLogger,
				src = path.join(__dirname, 'resources', 'testfile.txt'),
				dest = '/tmp';
			fs.existsSync(dest) || wrench.mkdirSyncRecursive(dest);
			appc.fs.copyFileSync(src, dest, { logger: logger.info.bind(logger) });
			logger.buffer.stripColors.should.equal('Copying ' + src + ' => ' + dest + path.sep + 'testfile.txt\n');
			assert(fs.existsSync(path.join(dest, 'testfile.txt')), 'Destination file does not exist');
		});

		it('copy file to existing directory', function () {
			var logger = new MockLogger,
				src = path.join(__dirname, 'resources', 'testfile.txt'),
				dest = temp.mkdirSync();
			appc.fs.copyFileSync(src, dest, { logger: logger.info.bind(logger) });
			logger.buffer.stripColors.should.equal('Copying ' + src + ' => ' + dest + path.sep + 'testfile.txt\n');
			assert(fs.existsSync(path.join(dest, 'testfile.txt')), 'Destination file does not exist');
		});

		it('copy file to non-existent directory', function () {
			var logger = new MockLogger,
				src = path.join(__dirname, 'resources', 'testfile.txt'),
				dest = path.join(temp.mkdirSync(), 'test');
			// since dest does not exist, it doesn't know it's a directory and the dest
			// file will be named "test" and not "testfile.txt"
			appc.fs.copyFileSync(src, dest, { logger: logger.info.bind(logger) });
			logger.buffer.stripColors.should.equal('Copying ' + src + ' => ' + dest + '\n');
			assert(fs.existsSync(dest), 'Destination file does not exist');
		});
	});

	describe('#visitDirsSync', function () {
		it('visit each subdirectory', function () {
			var dir = path.join(__dirname, 'resources', 'fs'),
				visited = {};
			appc.fs.visitDirsSync(dir, function (file, fullpath) {
				visited[file] = true;
				visited[fullpath] = true;
			});
			visited.should.have.property('a1');
			visited.should.have.property(path.join(dir, 'a1'));
			visited.should.have.property('a2');
			visited.should.have.property(path.join(dir, 'a2'));
		})
	});
});