/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars

describe('Titanium.Filesystem.File', function () {
	describe('#getDirectoryListing()', function () {
		it('is a Function', function () {
			var dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);
			should(dir.getDirectoryListing).be.a.Function;
		});

		it('returns Array of filenames for directory contents', function () {
			var dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory),
				files = dir.getDirectoryListing();
			should(dir.exists()).be.true;
			files.should.be.an.Array;
			files.length.should.be.above(0);
			files[0].should.be.a.String;
		});

		it('returns empty Array for empty directory', function () {
			var emptyDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'emptyDir'),
				result;
			should(emptyDir).be.ok;
			// remove it if it exists
			if (emptyDir.exists()) {
				should(emptyDir.deleteDirectory()).eql(true);
			}
			// create a fresh empty dir
			should(emptyDir.createDirectory()).eql(true);
			should(emptyDir.exists()).eql(true);
			should(emptyDir.isFile()).eql(false);
			should(emptyDir.isDirectory()).eql(true);

			result = emptyDir.getDirectoryListing();
			result.should.be.an.Array;
			result.length.should.eql(0);
		});

		it('returns null for non-existent directory', function () {
			var nonExistentDir = Ti.Filesystem.getFile('madeup');
			var result = nonExistentDir.getDirectoryListing();
			should(nonExistentDir).be.ok;
			should(nonExistentDir.exists()).eql(false);
			should(result).eql(null);
		});

		it('returns null for file', function () {
			var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
			var result = file.getDirectoryListing();
			should(file).be.ok;
			should(file.exists()).eql(true);
			should(file.isFile()).eql(true);
			should(result).eql(null);
		});
	});
});
