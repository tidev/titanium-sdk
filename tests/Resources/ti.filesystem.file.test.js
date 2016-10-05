/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.Filesystem.File', function () {
	it('apiName', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.readOnlyProperty('apiName').which.is.a.String;
		should(file.apiName).be.eql('Ti.Filesystem.File');
	});

	// Check if name exists and returns string
	it('name', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('name').which.is.a.String;
		should(file.name).be.eql('app.js');
	});

	// Check if nativePath exists and returns string
	it('nativePath', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('nativePath').which.is.a.String;
	});

	// Check if resolve exists and returns string
	it('#resolve()', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file.resolve).not.be.undefined;
		should(file.resolve).be.a.Function;
		var value = file.resolve();
		should(value).not.be.undefined;
		should(value).be.a.String;
		// On Windows, it returns native path
		if (utilities.isWindows()) {
			should(value).be.eql(file.nativePath);
		}
	});

	// Check if executable exists and returns boolean
	it('executable', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('executable').which.is.a.Boolean;
	});

	// Check if hidden exists and returns boolean
	it('hidden', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('hidden').which.is.a.Boolean;
	});

	// Check if readonly exists and returns boolean
	it('readonly', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('readonly').which.is.a.Boolean;
	});

	// Check if writable exists and returns boolean
	it('writable', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('writable').which.is.a.Boolean;
	});

	// Check if symbolicLink exists and returns boolean
	it('symbolicLink', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('symbolicLink').which.is.a.Boolean;
	});

	// Check if parent exists and returns File
	// Intentionally skip on iOS, property doesn't exist: https://jira.appcelerator.org/browse/TIMOB-23495
	(utilities.isIOS() ? it.skip : it)('parent', function () {
		var file = Ti.Filesystem.getFile('app.js');
		// parent may be null if at root?
		//should(file.parent).be.ok; // not null or undefined. should(file).not.be.null causes a stack overflow somehow.
		should(file).have.a.readOnlyProperty('parent');
	});

	// Check if size exists and returns number
	it('size', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.readOnlyProperty('size').which.is.a.Number;
		should(file.size).be.above(0);
	});

	// exists should return true if file exists
	it('#exists() returns true for existing file', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file.exists()).be.true;
	});

	// exists should return false if file is not there
	it('#exists() returns false for non-existent file', function () {
		var file = Ti.Filesystem.getFile('appp.js');
		should(file.exists()).be.false;
	});

	// isFile should return true if file exists
	it('#isFile() returns true for an existing file', function() {
		var file = Ti.Filesystem.getFile('app.js');
		should(file.exists()).be.true;
		should(file.isFile()).be.true;
	});

	// isFile should return false if file is not there
	it('#isFile() returns false for a file that doesn\'t exist', function () {
		var file = Ti.Filesystem.getFile('appp.js');
		should(file.exists()).be.false;
		should(file.isFile()).be.false;
	});

	// isFile should return false if file points to directory
	it('#isFile() returns false for a directory', function () {
		var dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);
		should(dir.isFile()).be.false;
	});

	// isDirectory should return true if file points to directory
	it('#isDirectory() returns true for directory that exists', function () {
		var dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);
		should(dir.isDirectory()).be.true;
	});

	// isDirectory should return false if file points to file
	it('#isDirectory() returns false for a file that exists', function () {
		var dir = Ti.Filesystem.getFile('app.js');
		should(dir.isDirectory()).be.false;
	});

	// isDirectory should return false if file is not there
	// FIXME Get working on Android?
	(utilities.isAndroid() ? it.skip : it)('#isDirectory() returns false for directory that doesn\'t exist', function () {
		var dir = Ti.Filesystem.getFile('appp');
		should(dir.isDirectory()).be.false;
	});

	// createTimestamp should return number
	// FIXME Get working on IOS // on iOS we gte Date/String
	(utilities.isIOS() ? it.skip : it)('#createTimestamp()', function () {
		var file = Ti.Filesystem.getFile('app.js');
		var create_date = file.createTimestamp();
		should(create_date).be.a.Number; // iOS returns a Date (or maybe a string in iso date format?) Docs say Number
		if (utilities.isAndroid()) { // Android returns 0 for createTimestamp
			should(create_date).eql(0);
		} else {
			should(create_date).be.above(0);
		}
	});

	// modificationTimestamp should return number
	// FIXME Get working on IOS // on iOS we gte Date/String
	(utilities.isIOS() ? it.skip : it)('#modificationTimestamp()', function () {
		var file = Ti.Filesystem.getFile('app.js');
		var mod_date = file.modificationTimestamp();
		should(mod_date).be.a.Number; // iOS returns a Date (or maybe a string in iso date format?) Docs say Number
		if (utilities.isAndroid()) { // Android returns 0 for createTimestamp
			should(mod_date).eql(0);
		} else {
			should(mod_date).be.above(0);
		}
	});

	// createDirectory and deleteDirectory
	it('create_and_deleteDirectory', function () {
		var newDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'mydir');
		should(newDir.exists()).be.false;
		newDir.createDirectory();
		should(newDir.exists()).be.true;
		should(newDir.deleteDirectory()).be.true;
		should(newDir.exists()).be.false;
	});

	// recursive deleteDirectory
	it('#deleteDirectory(true) - recursive', function () {
		var dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'testDir');
		should(dir.exists()).be.false;
		should(dir.createDirectory()).be.true;
		should(dir.exists()).be.true;

		var file = Ti.Filesystem.getFile(dir.resolve(), 'test.txt');
		should(file.exists()).be.false;
		should(file.write('Appcelerator')).be.true;
		should(file.exists()).be.true;

		var subDir = Ti.Filesystem.getFile(dir.resolve(), 'subDir');
		should(subDir.exists()).be.false;
		should(subDir.createDirectory()).be.true;
		should(subDir.exists()).be.true;

		var subFile = Ti.Filesystem.getFile(subDir.resolve(), 'subTest.txt');
		should(subFile.exists()).be.false;
		should(subFile.write('Appcelerator')).be.true;
		should(subFile.exists()).be.true;

		should(dir.deleteDirectory(true)).be.true;
		should(dir.exists()).be.false;
	});

	it('#createFile() and #deleteFile()', function () {
		var newFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'myfile');
		should(newFile.exists()).be.false;
		newFile.createFile();
		should(newFile.exists()).be.true;
		newFile.deleteFile();
		should(newFile.exists()).be.false;
	});

	it('#read()', function () {
		var newFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
		should(newFile.exists()).be.true;
		var blob = newFile.read();
		should(blob).be.ok; // not null or undefined.
		if (!utilities.isAndroid()) {
			should(blob.size).be.above(0);
		}
		should(blob.text.length).be.above(0);
	});

	it('#write(String, false)', function () {
		var msg = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(msg.write('Appcelerator', false)).be.true;
		should(msg.exists()).be.true;

		var blob = msg.read();
		should(blob).be.ok; // not null or undefined
		if (!utilities.isAndroid()) {
			should(blob.size).be.above(0);
		}
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('Appcelerator');

		should(msg.deleteFile()).be.true;
		should(msg.exists()).be.false;
	});

	it('#write(String, true) - append', function () {
		var msg = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(msg.write('Appcelerator', false)).be.true;
		should(msg.exists()).be.true;

		should(msg.write('Appcelerator', true)).be.true;

		var blob = msg.read();
		should(blob).be.ok; // not null or undefined.
		if (!utilities.isAndroid()) {
			should(blob.size).be.above(0);
		}
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('AppceleratorAppcelerator');

		should(msg.deleteFile()).be.true;
		should(msg.exists()).be.false;
	});

	it('#write(File, false)', function () {
		var from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(from.write('Appcelerator', false)).be.true;
		should(from.exists()).be.true;

		var to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write(from, false)).be.true;
		should(to.exists()).be.true;

		var blob = to.read();
		should(blob).be.ok; // not null or undefined.
		if (!utilities.isAndroid()) {
			should(blob.size).be.above(0);
		}
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('Appcelerator');

		should(from.deleteFile()).be.true;
		should(from.exists()).be.false;
		should(to.deleteFile()).be.true;
		should(to.exists()).be.false;
	});

	it('#write(File, true) - append', function () {
		var from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(from.write('Appcelerator', false)).be.true;
		should(from.exists()).be.true;

		var to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write('Appcelerator', false)).be.true;
		should(to.exists()).be.true;

		should(to.write(from, true)).be.true;

		var blob = to.read();
		should(blob).be.ok; // not null or undefined.
		if (!utilities.isAndroid()) {
			should(blob.size).be.above(0);
		}
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('AppceleratorAppcelerator');

		should(from.deleteFile()).be.true;
		should(from.exists()).be.false;
		should(to.deleteFile()).be.true;
		should(to.exists()).be.false;
	});

	it('#write(Blob, false)', function () {
		var from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(from.write('Appcelerator', false)).be.true;
		should(from.exists()).be.true;

		var to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write(from.read(), false)).be.true;
		should(to.exists()).be.true;

		var blob = to.read();
		should(blob).be.ok; // not null or undefined.
		if (!utilities.isAndroid()) {
			should(blob.size).be.above(0);
		}
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('Appcelerator');

		should(from.deleteFile()).be.true;
		should(from.exists()).be.false;
		should(to.deleteFile()).be.true;
		should(to.exists()).be.false;
	});

	it('#write(Blob, true) - append', function () {
		var from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(from.write('Appcelerator', false)).be.true;
		should(from.exists()).be.true;

		var to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write('Appcelerator', false)).be.true;
		should(to.exists()).be.true;

		should(to.write(from.read(), true)).be.true;

		var blob = to.read();
		should(blob).be.ok; // not null or undefined.
		if (!utilities.isAndroid()) {
			should(blob.size).be.above(0);
		}
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('AppceleratorAppcelerator');

		should(from.deleteFile()).be.true;
		should(from.exists()).be.false;
		should(to.deleteFile()).be.true;
		should(to.exists()).be.false;
	});

	// Intentionally skip on Android, doesn't support method
	(utilities.isAndroid() ? it.skip : it)('#append(String)', function () {
		var msg = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(msg.write('Appcelerator', false)).be.true;
		should(msg.exists()).be.true;

		should(msg.append('Appcelerator')).be.true;

		var blob = msg.read();
		should(blob).be.ok; // not null or undefined.
		if (!utilities.isAndroid()) {
			should(blob.size).be.above(0);
		}
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('AppceleratorAppcelerator');

		should(msg.deleteFile()).be.true;
		should(msg.exists()).be.false;
	});

	// Intentionally skip on Android, doesn't support method
	(utilities.isAndroid() ? it.skip : it)('#append(File)', function () {
		var from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(from.write('Appcelerator', false)).be.true;
		should(from.exists()).be.true;

		var to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write('Appcelerator', false)).be.true;
		should(to.exists()).be.true;

		should(to.append(from)).be.true;

		var blob = to.read();
		should(blob).be.ok; // not null or undefined.
		if (!utilities.isAndroid()) {
			should(blob.size).be.above(0);
		}
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('AppceleratorAppcelerator');

		should(from.deleteFile()).be.true;
		should(from.exists()).be.false;
		should(to.deleteFile()).be.true;
		should(to.exists()).be.false;
	});

	// Intentionally skip on Android, doesn't support method // TODO For parity, add #append() to File on Android: https://jira.appcelerator.org/browse/TIMOB-23493
	(utilities.isAndroid() ? it.skip : it)('#append(Blob)', function () {
		var from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(from.write('Appcelerator', false)).be.true;
		should(from.exists()).be.true;

		var to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write('Appcelerator', false)).be.true;
		should(to.exists()).be.true;

		should(to.append(from.read())).be.true;

		var blob = to.read();
		should(blob).be.ok; // not null or undefined.
		if (!utilities.isAndroid()) {
			should(blob.size).be.above(0);
		}
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('AppceleratorAppcelerator');

		should(from.deleteFile()).be.true;
		should(from.exists()).be.false;
		should(to.deleteFile()).be.true;
		should(to.exists()).be.false;
	});

	it('#open(MODE_READ)', function () {
		var newFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
		should(newFile.exists()).be.true;
		var stream = newFile.open(Ti.Filesystem.MODE_READ);
		should(stream).be.ok; // not null or undefined.
		stream.close();
	});

	// File.spaceAvailable
	// FIXME Get working on Android?
	(utilities.isAndroid() ? it.skip : it)('#spaceAvailable()', function () {
		var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
		should(file.exists()).be.true;
		var space = file.spaceAvailable();
		should(space).be.a.Number;
		should(space).be.above(0); // Android reports 0. Docs don't state that it should...
	});

	// File.copy
	// FIXME Get working on IOS
	(utilities.isIOS() ? it.skip : it)('#copy()', function () {
		var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
		should(file.exists()).be.true;
		var newpath = Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + 'app.js';
		should(file.copy(newpath)).be.true; // iOs gives: -[TiFilesystemFileProxy copyWithZone:]: unrecognized selector sent to instance 0x7fa06bf5bca0
		var dest = Ti.Filesystem.getFile(newpath);
		should(dest.exists()).be.true;
		should(dest.deleteFile()).be.true;
		should(dest.exists()).be.false;
	});

	// File copy and move
	// FIXME Get working on IOS
	(utilities.isIOS() ? it.skip : it)('#copy() and #move()', function () {
		var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
		should(file.exists()).be.true;

		var dest1 = Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + 'app.js';
		var dest2 = Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + 'appp.js';

		should(file.copy(dest1)).be.a.Boolean; // iOS gives -[TiFilesystemFileProxy copyWithZone:]: unrecognized selector sent to instance 0x7fa06bc28dc0

		var copy = Ti.Filesystem.getFile(dest1);
		should(copy.exists()).be.true;
		should(copy.move(dest2)).be.a.true;
		should(copy.exists()).be.false;
		var move = Ti.Filesystem.getFile(dest2);
		should(move.exists()).be.true;
		should(move.deleteFile()).be.true;
		should(move.exists()).be.false;
	});

	// Directory listing
	it('#directoryListing()', function () {
		var dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);
		should(dir.exists()).be.true;
		should(dir.getDirectoryListing).be.a.Function;
		var files = dir.getDirectoryListing();
		should(files).be.an.Array;
	});


	// TIMOB-19128
	// FIXME Get working on IOS
	(utilities.isIOS() ? it.skip : it)('#createDirectory() is recursive', function () {
		var dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'sub', 'dir2');
		should(dir.exists()).be.false;
		should(dir.createDirectory()).be.true;
		should(dir.exists()).be.true; // iOS returns false!
		should(dir.deleteDirectory()).be.true;
		should(dir.exists()).be.false;
	});

	// TIMOB-14364
	(utilities.isIOS() ? it : it.skip)('#setRemoteBackup()', function () {
		should(function () {
			Titanium.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory).setRemoteBackup(false);
		}).not.throw();
	});
});
