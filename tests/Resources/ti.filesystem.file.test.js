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
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.Filesystem.File', function () {
	it('.apiName', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.readOnlyProperty('apiName').which.is.a.String;
		should(file.apiName).be.eql('Ti.Filesystem.File');
	});

	// Check if name exists and returns string
	it('.name', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('name').which.is.a.String;
		should(file.name).be.eql('app.js');
	});

	// Check if nativePath exists and returns string
	it('.nativePath', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('nativePath').which.is.a.String;
	});

	// Check if resolve exists and returns string
	it('#resolve()', function () {
		var value;
		var file = Ti.Filesystem.getFile('app.js');
		should(file.resolve).not.be.undefined;
		should(file.resolve).be.a.Function;
		value = file.resolve();
		should(value).not.be.undefined;
		should(value).be.a.String;
		// On Windows, it returns native path
		if (utilities.isWindows()) {
			should(value).be.eql(file.nativePath);
		}
	});

	// Check if executable exists and returns boolean
	it('.executable', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('executable').which.is.a.Boolean;
	});

	// Check if hidden exists and returns boolean
	it('.hidden', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('hidden').which.is.a.Boolean;
	});

	// Check if readonly exists and returns boolean
	it('.readonly', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('readonly').which.is.a.Boolean;
	});

	// Check if writable exists and returns boolean
	it('.writable', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('writable').which.is.a.Boolean;
	});

	// Check if symbolicLink exists and returns boolean
	it('.symbolicLink', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('symbolicLink').which.is.a.Boolean;
	});

	// Check if parent exists and returns File
	it('.parent', function () {
		var file = Ti.Filesystem.getFile('app.js');
		// parent may be null if at root?
		// should(file.parent).be.ok; // not null or undefined. should(file).not.be.null causes a stack overflow somehow.
		should(file).have.a.readOnlyProperty('parent');
		// TODO: Test that we get back another file proxy?
	});

	// Check if size exists and returns number
	it('.size', function () {
		var file = Ti.Filesystem.getFile('app.js');
		should(file).have.readOnlyProperty('size').which.is.a.Number;
		should(file.size).be.above(0);
	});

	describe('#exists()', function () {
		it('is a Function', function () {
			var file = Ti.Filesystem.getFile('app.js');
			should(file.exists).be.a.Function;
		});

		// exists should return true if file exists
		it('returns true for existing file', function () {
			var file = Ti.Filesystem.getFile('app.js');
			should(file.exists()).be.true;
		});

		// exists should return false if file is not there
		it('returns false for non-existent file', function () {
			var file = Ti.Filesystem.getFile('appp.js');
			should(file.exists()).be.false;
		});
	});

	describe('#isFile()', function () {
		it('is a Function', function () {
			var file = Ti.Filesystem.getFile('app.js');
			should(file.isFile).be.a.Function;
		});

		it('returns true for an existing file', function () {
			var file = Ti.Filesystem.getFile('app.js');
			should(file.exists()).be.true;
			should(file.isFile()).be.true;
		});

		it('returns false for a file that doesn\'t exist', function () {
			var file = Ti.Filesystem.getFile('appp.js');
			should(file.exists()).be.false;
			should(file.isFile()).be.false;
		});

		it('returns false for a directory', function () {
			var dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);
			should(dir.isFile()).be.false;
		});
	});

	describe('#isDirectory()', function () {
		it('is a Function', function () {
			var file = Ti.Filesystem.getFile('app.js');
			should(file.isDirectory).be.a.Function;
		});

		it('returns true for directory that exists', function () {
			var dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);
			should(dir.isDirectory()).be.true;
		});

		it('returns false for a file that exists', function () {
			var dir = Ti.Filesystem.getFile('app.js');
			should(dir.isDirectory()).be.false;
		});

		it('returns false for directory that doesn\'t exist', function () {
			var dir = Ti.Filesystem.getFile('appp');
			should(dir.isDirectory()).be.false;
		});
	});

	// This method is now deprecated due to difference in return type between iOS and other platforms
	// #createdAt() is new version returning a Date object
	describe('#createTimestamp()', function () {
		it('is a Function', function () {
			var file = Ti.Filesystem.getFile('app.js');
			should(file.createTimestamp).be.a.Function;
		});

		// iOS returns a Date
		it.iosBroken('returns a Number', function () {
			var file = Ti.Filesystem.getFile('app.js');
			var create_date = file.createTimestamp();
			should(create_date).be.a.Number; // iOS returns a Date (or maybe a string in iso date format?) Docs say Number
			if (utilities.isAndroid()) { // Android returns 0 for createTimestamp on files under Resources dir
				should(create_date).eql(0);
			} else {
				should(create_date).be.above(0);
			}
		});
	});

	describe('#createdAt()', function () {
		it('is a Function', function () {
			var file = Ti.Filesystem.getFile('app.js');
			should(file.createdAt).be.a.Function;
		});

		it('returns a Date', function () {
			var file = Ti.Filesystem.getFile('app.js');
			var create_date = file.createdAt();
			should(create_date).be.a.Date;
			if (utilities.isAndroid()) {
				should(create_date.getTime()).be.eql(0); // Android gives equivalent of 0 for timestamp
			} else {
				should(create_date.getTime()).be.above(0);
			}
		});

		it.android('returns a non-zero Date timestamp for files outside app', function () {
			var file = Ti.Filesystem.createTempFile();
			var create_date = file.createdAt();
			should(create_date).be.a.Date;
			should(create_date.getTime()).be.above(0);
		});
	});

	// This method is now deprecated due to difference in return type between iOS and other platforms
	// #modifiedAt() is new version returning a Date object
	describe('#modificationTimestamp()', function () {
		it('is a Function', function () {
			var file = Ti.Filesystem.getFile('app.js');
			should(file.modificationTimestamp).be.a.Function;
		});

		it.iosBroken('returns a Number', function () {
			var file = Ti.Filesystem.getFile('app.js');
			var mod_date = file.modificationTimestamp();
			should(mod_date).be.a.Number; // iOS returns a Date (or maybe a string in iso date format?) Docs say Number
			if (utilities.isAndroid()) { // Android returns 0 for modificationTimestamp on files under Resources dir
				should(mod_date).eql(0);
			} else {
				should(mod_date).be.above(0);
			}
		});
	});

	describe('#modifiedAt()', function () {
		it('is a Function', function () {
			var file = Ti.Filesystem.getFile('app.js');
			should(file.modifiedAt).be.a.Function;
		});

		it('returns a Date', function () {
			var file = Ti.Filesystem.getFile('app.js');
			var mod_date = file.modifiedAt();
			should(mod_date).be.a.Date;
			if (utilities.isAndroid()) { // Android returns 0 for modificationTimestamp on files under Resources dir
				should(mod_date.getTime()).eql(0);
			} else {
				should(mod_date.getTime()).be.above(0);
			}
		});
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
		var dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'testDir'),
			file,
			subDir,
			subFile;
		should(dir.exists()).be.false;
		should(dir.createDirectory()).be.true;
		should(dir.exists()).be.true;

		file = Ti.Filesystem.getFile(dir.resolve(), 'test.txt');
		should(file.exists()).be.false;
		should(file.write('Appcelerator')).be.true;
		should(file.exists()).be.true;

		subDir = Ti.Filesystem.getFile(dir.resolve(), 'subDir');
		should(subDir.exists()).be.false;
		should(subDir.createDirectory()).be.true;
		should(subDir.exists()).be.true;

		subFile = Ti.Filesystem.getFile(subDir.resolve(), 'subTest.txt');
		should(subFile.exists()).be.false;
		should(subFile.write('Appcelerator')).be.true;
		should(subFile.exists()).be.true;

		should(dir.deleteDirectory(true)).be.true;
		should(dir.exists()).be.false;
	});

	it.windowsBroken('#createFile() and #deleteFile()', function () {
		var newFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'myfile');
		should(newFile.exists()).be.false;
		newFile.createFile();
		should(newFile.exists()).be.true; // windows returns false here. Probably an async timing issue?
		newFile.deleteFile();
		should(newFile.exists()).be.false;
	});

	it('#read()', function () {
		var newFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js'),
			blob;
		should(newFile.exists()).be.true;
		blob = newFile.read();
		should(blob).be.ok; // not null or undefined.
		if (!utilities.isAndroid()) {
			should(blob.size).be.above(0);
		}
		should(blob.text.length).be.above(0);
	});

	it('#write(String, false)', function () {
		var msg = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt'),
			blob;
		should(msg.write('Appcelerator', false)).be.true;
		should(msg.exists()).be.true;

		blob = msg.read();
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
		var msg = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt'),
			blob;
		should(msg.write('Appcelerator', false)).be.true;
		should(msg.exists()).be.true;

		should(msg.write('Appcelerator', true)).be.true;

		blob = msg.read();
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
		var from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt'),
			to,
			blob;
		should(from.write('Appcelerator', false)).be.true;
		should(from.exists()).be.true;

		to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write(from, false)).be.true;
		should(to.exists()).be.true;

		blob = to.read();
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
		var from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt'),
			to,
			blob;
		should(from.write('Appcelerator', false)).be.true;
		should(from.exists()).be.true;

		to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write('Appcelerator', false)).be.true;
		should(to.exists()).be.true;

		should(to.write(from, true)).be.true;

		blob = to.read();
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
		var from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt'),
			to,
			blob;
		should(from.write('Appcelerator', false)).be.true;
		should(from.exists()).be.true;

		to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write(from.read(), false)).be.true;
		should(to.exists()).be.true;

		blob = to.read();
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

	// FIXME Causes the test suite to hang later if not logged into Windows Desktop build machine!
	it.windowsDesktopBroken('#write(Blob, true) - append', function () {
		var from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt'),
			to,
			blob;
		should(from.write('Appcelerator', false)).be.true;
		should(from.exists()).be.true;

		to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write('Appcelerator', false)).be.true;
		should(to.exists()).be.true;

		should(to.write(from.read(), true)).be.true;

		blob = to.read();
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
	// We are eventually hanging after Titanium.Filesystem.FileStream.fileStreamTruncateTest

	// FIXME Causes the test suite to hang later if not logged into Windows Desktop build machine!
	it.windowsDesktopBroken('#append(String)', function () {
		var msg = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt'),
			blob;
		should(msg.write('Appcelerator', false)).be.true;
		should(msg.exists()).be.true;

		should(msg.append('Appcelerator')).be.true;

		blob = msg.read();
		should(blob).be.ok; // not null or undefined.
		if (!utilities.isAndroid()) {
			should(blob.size).be.above(0);
		}
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('AppceleratorAppcelerator');

		should(msg.deleteFile()).be.true;
		should(msg.exists()).be.false;
	});

	// FIXME Causes the test suite to hang later if not logged into Windows Desktop build machine!
	it.windowsDesktopBroken('#append(File)', function () {
		var from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt'),
			to,
			blob;
		should(from.write('Appcelerator', false)).be.true;
		should(from.exists()).be.true;

		to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write('Appcelerator', false)).be.true;
		should(to.exists()).be.true;

		should(to.append(from)).be.true;

		blob = to.read();
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

	// FIXME Causes the test suite to hang later if not logged into Windows Desktop build machine!
	it.windowsDesktopBroken('#append(Blob)', function () {
		var from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt'),
			to,
			blob;
		should(from.write('Appcelerator', false)).be.true;
		should(from.exists()).be.true;

		to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write('Appcelerator', false)).be.true;
		should(to.exists()).be.true;

		should(to.append(from.read())).be.true;

		blob = to.read();
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
		var newFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js'),
			stream;
		should(newFile.exists()).be.true;
		stream = newFile.open(Ti.Filesystem.MODE_READ);
		should(stream).be.ok; // not null or undefined.
		stream.close();
	});

	// File.spaceAvailable
	it('#spaceAvailable()', function () {
		var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js'),
			space;
		should(file.exists()).be.true;
		space = file.spaceAvailable();
		should(space).be.a.Number;
		if (utilities.isAndroid()) {
			should(space).be.eql(0); // reports 0 for Resources dir/file
		} else {
			should(space).be.above(0);
		}
	});

	// File.copy
	it('#copy()', function () {
		var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js'),
			newpath,
			dest;
		should(file.exists()).be.true;
		newpath = Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + 'app.js';
		should(file.copy(newpath)).be.true; // iOs gives: -[TiFilesystemFileProxy copyWithZone:]: unrecognized selector sent to instance 0x7fa06bf5bca0
		dest = Ti.Filesystem.getFile(newpath);
		should(dest.exists()).be.true;
		should(dest.deleteFile()).be.true;
		should(dest.exists()).be.false;
	});

	// File copy and move
	it('#copy() and #move()', function () {
		var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js'),
			dest1,
			dest2,
			copy,
			move;
		should(file.exists()).be.true;

		dest1 = Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + 'app.js';
		dest2 = Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + 'appp.js';

		should(file.copy(dest1)).be.a.Boolean; // iOS gives -[TiFilesystemFileProxy copyWithZone:]: unrecognized selector sent to instance 0x7fa06bc28dc0

		copy = Ti.Filesystem.getFile(dest1);
		should(copy.exists()).be.true;
		should(copy.move(dest2)).be.a.true;
		should(copy.exists()).be.false;
		move = Ti.Filesystem.getFile(dest2);
		should(move.exists()).be.true;
		should(move.deleteFile()).be.true;
		should(move.exists()).be.false;
	});

	// Directory listing
	it('#directoryListing()', function () {
		var dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory),
			files;
		should(dir.exists()).be.true;
		should(dir.getDirectoryListing).be.a.Function;
		files = dir.getDirectoryListing();
		should(files).be.an.Array;
	});

	// TIMOB-19128
	it('#createDirectory() is recursive', function () {
		var dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'sub', 'dir2');
		should(dir.exists()).be.false;
		should(dir.createDirectory()).be.true;
		should(dir.exists()).be.true; // iOS returns false!
		should(dir.deleteDirectory()).be.true;
		should(dir.exists()).be.false;
	});

	// TIMOB-14364
	it.ios('#setRemoteBackup()', function () {
		should(function () {
			Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory).setRemoteBackup(false);
		}).not.throw();
	});
});
