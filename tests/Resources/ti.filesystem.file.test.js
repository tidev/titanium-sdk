/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
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
			// Android returns 0 for timestamp on files under Resources dir
			// we also can't get real modification/create times for encrypted files
			if (utilities.isAndroid() || Ti.App.deployType === 'test') {
				should(create_date.getTime()).be.eql(0);
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
			// Android returns 0 for modificationTimestamp on files under Resources dir
			// we also can't get real modification/create times for encrypted files
			if (utilities.isAndroid() || Ti.App.deployType === 'test') {
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

	it('#createFile() and #deleteFile()', function () {
		var newFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'myfile');
		should(newFile.exists()).be.false;
		newFile.createFile();
		should(newFile.exists()).be.true;
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

	describe('#copy()', function () {
		it('is a function', function () {
			var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
			should(file.copy).be.a.Function;
		});

		it('copies File successfully to new path', function () {
			var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js'),
				newpath,
				dest;
			should(file.exists()).be.true;
			newpath = Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + 'app.js';
			should(file.copy(newpath)).be.true;
			dest = Ti.Filesystem.getFile(newpath);
			should(dest.exists()).be.true;
			should(dest.deleteFile()).be.true;
			should(dest.exists()).be.false;
		});
	});

	describe('#move()', function () {
		it('is a function', function () {
			var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
			should(file.move).be.a.Function;
		});

		it('moves file within same directory', function () {
			// var appDataDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory);
			// FIXME Move to a different directory!
			var destPath = Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + 'moved.txt';
			var dest = Ti.Filesystem.getFile(destPath);
			var fileATxt = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fileA.txt');

			// ensure fileA.txt and moved.txt don't exist!
			if (dest.exists()) {
				dest.deleteFile();
			}
			if (fileATxt.exists()) {
				fileATxt.deleteFile();
			}

			// write some initial contents
			should(fileATxt.write('text initial ')).eql.true;
			should(fileATxt.exists()).eql.true;

			// Now move the file
			should(fileATxt.move(destPath)).eql.true;

			// Now verify that the original file doesn't exist and the new file does
			should(fileATxt.exists()).eql.false;
			should(dest.exists()).eql.true;
		});

		it('moves file to another directory', function () {
			var subdir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'subdir');
			var dest = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'subdir', 'moved.txt');
			var fileATxt = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fileA.txt');

			// ensure fileA.txt and moved.txt don't exist!
			if (dest.exists()) {
				dest.deleteFile();
			}
			if (fileATxt.exists()) {
				fileATxt.deleteFile();
			}

			if (!subdir.exists()) {
				should(subdir.createDirectory()).eql.true;
			}

			// write some initial contents
			should(fileATxt.write('text initial ')).eql.true;
			should(fileATxt.exists()).eql.true;

			// Now move the file
			should(fileATxt.move(dest.nativePath)).eql.true;

			// Now verify that the original file doesn't exist and the new file does
			should(fileATxt.exists()).eql.false;
			should(dest.exists()).eql.true;
		});
	});

	describe('#rename()', function () {
		it('is a function', function () {
			var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
			should(file.rename).be.a.Function;
		});

		it('renames file within same directory', function () {
			var destPath = Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + 'renamed.txt';
			var dest = Ti.Filesystem.getFile(destPath);
			var fileATxt = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fileA.txt');

			// ensure fileA.txt and renamed.txt don't exist!
			if (dest.exists()) {
				dest.deleteFile();
			}
			if (fileATxt.exists()) {
				fileATxt.deleteFile();
			}

			// write some initial contents
			should(fileATxt.write('text initial ')).eql.true;
			should(fileATxt.exists()).eql.true;

			// Now rename the file
			should(fileATxt.rename(destPath)).eql.true;

			// Now verify that the original file doesn't exist and the new file does
			should(fileATxt.exists()).eql.false;
			should(dest.exists()).eql.true;
		});

		it('fails to rename file to another directory', function () {
			var subdir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'subdir');
			var dest = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'subdir', 'renamed.txt');
			var fileATxt = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fileA.txt');

			// ensure fileA.txt and renamed.txt don't exist!
			if (dest.exists()) {
				dest.deleteFile();
			}
			if (fileATxt.exists()) {
				fileATxt.deleteFile();
			}

			if (!subdir.exists()) {
				should(subdir.createDirectory()).eql.true;
			}

			// write some initial contents
			should(fileATxt.write('text initial ')).eql.true;
			should(fileATxt.exists()).eql.true;

			// Now move the file
			should(fileATxt.rename(dest.nativePath)).eql.false;

			// Now verify that the original file still exists and the new file doesn't
			should(fileATxt.exists()).eql.true;
			should(dest.exists()).eql.false;
		});
	});

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
			should.not.exist(result); // null or undefined // FIXME: ios returns undefined, test checked for exactly null before
		});

		it('returns null for file', function () {
			var file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
			var result = file.getDirectoryListing();
			should(file).be.ok;
			should(file.exists()).eql(true);
			should(file.isFile()).eql(true);
			should.not.exist(result); // null or undefined // FIXME: ios returns undefined, test checked for exactly null before
		});

		it.windowsBroken('can access resource directory files', function () {
			let rootDir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory),
				rootPath,
				filesFound = {};
			should(rootDir.exists()).be.true;
			should(rootDir.getDirectoryListing).be.a.Function;
			should(rootDir.getDirectoryListing()).be.an.Array;

			// Traverse entire Resources directory tree looking for files/directories in "filesFound".
			rootPath = rootDir.nativePath;
			filesFound[rootPath + 'app.js'] = false;
			filesFound[rootPath + 'ti.ui.webview.test.html'] = false;
			filesFound[rootPath + 'fixtures' + Ti.Filesystem.separator] = false; // Subdirectory containing only JS files.
			filesFound[rootPath + 'fixtures' + Ti.Filesystem.separator + 'empty-double.js'] = false;
			filesFound[rootPath + 'txtFiles' + Ti.Filesystem.separator] = false; // Subdirectory containing only assets.
			filesFound[rootPath + 'txtFiles' + Ti.Filesystem.separator + 'text.txt'] = false;
			function searchFileTree(file) {
				if (file) {
					let fileList = file.getDirectoryListing();
					if (fileList) {
						for (let index = 0; index < fileList.length; index++) {
							let nextFile = Ti.Filesystem.getFile(file.nativePath, fileList[index]);
							if (nextFile) {
								let absolutePath = nextFile.nativePath;
								if (absolutePath in filesFound) {
									filesFound[absolutePath] = true;
								}
								searchFileTree(nextFile);
							}
						}
					}
				}
			}
			searchFileTree(rootDir);
			for (let key in filesFound) {
				Ti.API.info('Checking if found file: ' + key);
				should(filesFound[key]).be.true;
			}
		});
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

	it.android('TIMOB-27193', () => {
		const filename = `TIMOB-27193_${Date.now()}.txt`;
		const file = Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory, filename);
		const originalPath = file.nativePath;
		file.createFile();
		should(file.exists()).eql(true);
		// make sure we're not getting swindled by having the underlying file inside the proxy get changed on us!
		should(file.nativePath).eql(originalPath);
	});
});
