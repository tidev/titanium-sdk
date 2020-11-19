/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

const isIOS = utilities.isIOS();
const isAndroid = !isIOS && utilities.isAndroid();

describe('Titanium.Filesystem.File', function () {
	it('.apiName', function () {
		const file = Ti.Filesystem.getFile('app.js');
		should(file).have.readOnlyProperty('apiName').which.is.a.String();
		should(file.apiName).be.eql('Ti.Filesystem.File');
	});

	// Check if name exists and returns string
	it('.name', function () {
		const file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('name').which.is.a.String();
		should(file.name).be.eql('app.js');
	});

	// Check if nativePath exists and returns string
	it('.nativePath', function () {
		const file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('nativePath').which.is.a.String();
	});

	// Check if resolve exists and returns string
	it('#resolve()', function () {
		const file = Ti.Filesystem.getFile('app.js');
		should(file.resolve).not.be.undefined();
		should(file.resolve).be.a.Function();
		const value = file.resolve();
		should(value).not.be.undefined();
		should(value).be.a.String();
		// On Windows, it returns native path
		if (utilities.isWindows()) {
			should(value).be.eql(file.nativePath);
		}
	});

	// Check if executable exists and returns boolean
	it('.executable', function () {
		const file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('executable').which.is.a.Boolean();
	});

	// Check if hidden exists and returns boolean
	it('.hidden', function () {
		const file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('hidden').which.is.a.Boolean();
	});

	// Check if readonly exists and returns boolean
	it('.readonly', function () {
		const file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('readonly').which.is.a.Boolean();
	});

	// Check if writable exists and returns boolean
	it('.writable', function () {
		const file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('writable').which.is.a.Boolean();
	});

	// Check if symbolicLink exists and returns boolean
	it('.symbolicLink', function () {
		const file = Ti.Filesystem.getFile('app.js');
		should(file).have.a.readOnlyProperty('symbolicLink').which.is.a.Boolean();
	});

	// Check if parent exists and returns File
	it('.parent', function () {
		const file = Ti.Filesystem.getFile('app.js');
		// parent may be null if at root?
		// should(file.parent).be.ok(); // not null or undefined. should(file).not.be.null causes a stack overflow somehow.
		should(file).have.a.readOnlyProperty('parent');
		// TODO: Test that we get back another file proxy?
	});

	// Check if size exists and returns number
	it('.size', function () {
		const file = Ti.Filesystem.getFile('app.js');
		should(file).have.readOnlyProperty('size').which.is.a.Number();
		should(file.size).be.above(0);
	});

	describe('#exists()', function () {
		it('is a Function', function () {
			const file = Ti.Filesystem.getFile('app.js');
			should(file.exists).be.a.Function();
		});

		// exists should return true if file exists
		it('returns true for existing file', function () {
			const file = Ti.Filesystem.getFile('app.js');
			should(file.exists()).be.true();
		});

		// exists should return false if file is not there
		it('returns false for non-existent file', function () {
			const file = Ti.Filesystem.getFile('appp.js');
			should(file.exists()).be.false();
		});
	});

	describe('#isFile()', function () {
		it('is a Function', function () {
			const file = Ti.Filesystem.getFile('app.js');
			should(file.isFile).be.a.Function();
		});

		it('returns true for an existing file', function () {
			const file = Ti.Filesystem.getFile('app.js');
			should(file.exists()).be.true();
			should(file.isFile()).be.true();
		});

		it('returns false for a file that doesn\'t exist', function () {
			const file = Ti.Filesystem.getFile('appp.js');
			should(file.exists()).be.false();
			should(file.isFile()).be.false();
		});

		it('returns false for a directory', function () {
			const dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);
			should(dir.isFile()).be.false();
		});
	});

	describe('#isDirectory()', function () {
		it('is a Function', function () {
			const file = Ti.Filesystem.getFile('app.js');
			should(file.isDirectory).be.a.Function();
		});

		it('returns true for directory that exists', function () {
			const dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);
			should(dir.isDirectory()).be.true();
		});

		it('returns false for a file that exists', function () {
			const dir = Ti.Filesystem.getFile('app.js');
			should(dir.isDirectory()).be.false();
		});

		it('returns false for directory that doesn\'t exist', function () {
			const dir = Ti.Filesystem.getFile('appp');
			should(dir.isDirectory()).be.false();
		});
	});

	// This method is now deprecated due to difference in return type between iOS and other platforms
	// #createdAt() is new version returning a Date object
	describe('#createTimestamp()', function () {
		it('is a Function', function () {
			const file = Ti.Filesystem.getFile('app.js');
			should(file.createTimestamp).be.a.Function();
		});

		// iOS returns a Date
		it.iosBroken('returns a Number', function () {
			const file = Ti.Filesystem.getFile('app.js');
			const create_date = file.createTimestamp();
			should(create_date).be.a.Number(); // iOS returns a Date (or maybe a string in iso date format?) Docs say Number
			should(create_date).be.above(0);
		});
	});

	describe('#createdAt()', function () {
		it('is a Function', function () {
			const file = Ti.Filesystem.getFile('app.js');
			should(file.createdAt).be.a.Function();
		});

		it('returns a Date', function () {
			const file = Ti.Filesystem.getFile('app.js');
			const create_date = file.createdAt();
			should(create_date).be.a.Date();
			// We can't get a real modification/create times for encrypted files on iOS.
			if (isIOS && Ti.App.Properties.getBool('js.encrypted', false)) {
				should(create_date.getTime()).be.eql(0);
			} else {
				should(create_date.getTime()).be.above(0);
			}
		});

		it.android('returns a non-zero Date timestamp for files outside app', function () {
			const file = Ti.Filesystem.createTempFile();
			const create_date = file.createdAt();
			should(create_date).be.a.Date();
			should(create_date.getTime()).be.above(0);
		});
	});

	// This method is now deprecated due to difference in return type between iOS and other platforms
	// #modifiedAt() is new version returning a Date object
	describe('#modificationTimestamp()', function () {
		it('is a Function', function () {
			const file = Ti.Filesystem.getFile('app.js');
			should(file.modificationTimestamp).be.a.Function();
		});

		it.iosBroken('returns a Number', function () {
			const file = Ti.Filesystem.getFile('app.js');
			const mod_date = file.modificationTimestamp();
			should(mod_date).be.a.Number(); // iOS returns a Date (or maybe a string in iso date format?) Docs say Number
			should(mod_date).be.above(0);
		});
	});

	describe('#modifiedAt()', function () {
		it('is a Function', function () {
			const file = Ti.Filesystem.getFile('app.js');
			should(file.modifiedAt).be.a.Function();
		});

		it('returns a Date', function () {
			const file = Ti.Filesystem.getFile('app.js');
			const mod_date = file.modifiedAt();
			should(mod_date).be.a.Date();
			// We can't get real modification/create times for encrypted files on iOS.
			if (isIOS && Ti.App.deployType === 'test') {
				should(mod_date.getTime()).eql(0);
			} else {
				should(mod_date.getTime()).be.above(0);
			}
		});
	});

	// createDirectory and deleteDirectory
	it('create_and_deleteDirectory', function () {
		const newDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'mydir');
		should(newDir.exists()).be.false();
		newDir.createDirectory();
		should(newDir.exists()).be.true();
		should(newDir.deleteDirectory()).be.true();
		should(newDir.exists()).be.false();
	});

	// recursive deleteDirectory
	it('#deleteDirectory(true) - recursive', function () {
		const dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'testDir');
		should(dir.exists()).be.false();
		should(dir.createDirectory()).be.true();
		should(dir.exists()).be.true();

		const file = Ti.Filesystem.getFile(dir.resolve(), 'test.txt');
		should(file.exists()).be.false();
		should(file.write('Appcelerator')).be.true();
		should(file.exists()).be.true();

		const subDir = Ti.Filesystem.getFile(dir.resolve(), 'subDir');
		should(subDir.exists()).be.false();
		should(subDir.createDirectory()).be.true();
		should(subDir.exists()).be.true();

		const subFile = Ti.Filesystem.getFile(subDir.resolve(), 'subTest.txt');
		should(subFile.exists()).be.false();
		should(subFile.write('Appcelerator')).be.true();
		should(subFile.exists()).be.true();

		should(dir.deleteDirectory(true)).be.true();
		should(dir.exists()).be.false();
	});

	it('#createFile() and #deleteFile()', function () {
		const newFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'myfile');
		should(newFile.exists()).be.false();
		newFile.createFile();
		should(newFile.exists()).be.true();
		newFile.deleteFile();
		should(newFile.exists()).be.false();
	});

	it('#read()', function () {
		const newFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
		should(newFile.exists()).be.true();
		const blob = newFile.read();
		should(blob).be.ok(); // not null or undefined.
		should(blob.size).be.above(0);
		should(blob.text.length).be.above(0);
	});

	it('#write(String, false)', function () {
		const msg = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(msg.write('Appcelerator', false)).be.true();
		should(msg.exists()).be.true();

		const blob = msg.read();
		should(blob).be.ok(); // not null or undefined
		should(blob.size).be.above(0);
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('Appcelerator');

		should(msg.deleteFile()).be.true();
		should(msg.exists()).be.false();
	});

	it('#write(String, true) - append', function () {
		const msg = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(msg.write('Appcelerator', false)).be.true();
		should(msg.exists()).be.true();

		should(msg.write('Appcelerator', true)).be.true();

		const blob = msg.read();
		should(blob).be.ok(); // not null or undefined.
		should(blob.size).be.above(0);
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('AppceleratorAppcelerator');

		should(msg.deleteFile()).be.true();
		should(msg.exists()).be.false();
	});

	it('#write(File, false)', function () {
		const from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(from.write('Appcelerator', false)).be.true();
		should(from.exists()).be.true();

		const to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write(from, false)).be.true();
		should(to.exists()).be.true();

		const blob = to.read();
		should(blob).be.ok(); // not null or undefined.
		should(blob.size).be.above(0);
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('Appcelerator');

		should(from.deleteFile()).be.true();
		should(from.exists()).be.false();
		should(to.deleteFile()).be.true();
		should(to.exists()).be.false();
	});

	it('#write(File, true) - append', function () {
		const from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(from.write('Appcelerator', false)).be.true();
		should(from.exists()).be.true();

		const to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write('Appcelerator', false)).be.true();
		should(to.exists()).be.true();

		should(to.write(from, true)).be.true();

		const blob = to.read();
		should(blob).be.ok(); // not null or undefined.
		should(blob.size).be.above(0);
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('AppceleratorAppcelerator');

		should(from.deleteFile()).be.true();
		should(from.exists()).be.false();
		should(to.deleteFile()).be.true();
		should(to.exists()).be.false();
	});

	it('#write(Blob, false)', function () {
		const from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(from.write('Appcelerator', false)).be.true();
		should(from.exists()).be.true();

		const to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write(from.read(), false)).be.true();
		should(to.exists()).be.true();

		const blob = to.read();
		should(blob).be.ok(); // not null or undefined.
		should(blob.size).be.above(0);
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('Appcelerator');

		should(from.deleteFile()).be.true();
		should(from.exists()).be.false();
		should(to.deleteFile()).be.true();
		should(to.exists()).be.false();
	});

	// FIXME Causes the test suite to hang later if not logged into Windows Desktop build machine!
	it.windowsDesktopBroken('#write(Blob, true) - append', function () {
		const from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(from.write('Appcelerator', false)).be.true();
		should(from.exists()).be.true();

		const to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write('Appcelerator', false)).be.true();
		should(to.exists()).be.true();

		should(to.write(from.read(), true)).be.true();

		const blob = to.read();
		should(blob).be.ok(); // not null or undefined.
		should(blob.size).be.above(0);
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('AppceleratorAppcelerator');

		should(from.deleteFile()).be.true();
		should(from.exists()).be.false();
		should(to.deleteFile()).be.true();
		should(to.exists()).be.false();
	});
	// We are eventually hanging after Titanium.Filesystem.FileStream.fileStreamTruncateTest

	// FIXME Causes the test suite to hang later if not logged into Windows Desktop build machine!
	it.windowsDesktopBroken('#append(String)', function () {
		const msg = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(msg.write('Appcelerator', false)).be.true();
		should(msg.exists()).be.true();

		should(msg.append('Appcelerator')).be.true();

		const blob = msg.read();
		should(blob).be.ok(); // not null or undefined.
		should(blob.size).be.above(0);
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('AppceleratorAppcelerator');

		should(msg.deleteFile()).be.true();
		should(msg.exists()).be.false();
	});

	// FIXME Causes the test suite to hang later if not logged into Windows Desktop build machine!
	it.windowsDesktopBroken('#append(File)', function () {
		const from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(from.write('Appcelerator', false)).be.true();
		should(from.exists()).be.true();

		const to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write('Appcelerator', false)).be.true();
		should(to.exists()).be.true();

		should(to.append(from)).be.true();

		const blob = to.read();
		should(blob).be.ok(); // not null or undefined.
		should(blob.size).be.above(0);
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('AppceleratorAppcelerator');

		should(from.deleteFile()).be.true();
		should(from.exists()).be.false();
		should(to.deleteFile()).be.true();
		should(to.exists()).be.false();
	});

	// FIXME Causes the test suite to hang later if not logged into Windows Desktop build machine!
	it.windowsDesktopBroken('#append(Blob)', function () {
		const from = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test.txt');
		should(from.write('Appcelerator', false)).be.true();
		should(from.exists()).be.true();

		const to = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'write_test_to.txt');
		should(to.write('Appcelerator', false)).be.true();
		should(to.exists()).be.true();

		should(to.append(from.read())).be.true();

		const blob = to.read();
		should(blob).be.ok(); // not null or undefined.
		should(blob.size).be.above(0);
		should(blob.text.length).be.above(0);
		should(blob.text).be.eql('AppceleratorAppcelerator');

		should(from.deleteFile()).be.true();
		should(from.exists()).be.false();
		should(to.deleteFile()).be.true();
		should(to.exists()).be.false();
	});

	it('#open(MODE_READ)', function () {
		const newFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
		should(newFile.exists()).be.true();
		const stream = newFile.open(Ti.Filesystem.MODE_READ);
		should(stream).be.ok(); // not null or undefined.
		stream.close();
	});

	// File.spaceAvailable
	it('#spaceAvailable()', function () {
		const file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
		should(file.exists()).be.true();
		const space = file.spaceAvailable();
		should(space).be.a.Number();
		if (isAndroid) {
			should(space).be.eql(0); // reports 0 for Resources dir/file
		} else {
			should(space).be.above(0);
		}
	});

	describe('#copy()', function () {
		it('is a function', function () {
			const file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
			should(file.copy).be.a.Function();
		});

		it('copies File successfully to new path', function () {
			const file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
			should(file.exists()).be.true();
			const newpath = Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + 'app.js';
			should(file.copy(newpath)).be.true();
			const dest = Ti.Filesystem.getFile(newpath);
			should(dest.exists()).be.true();
			should(dest.deleteFile()).be.true();
			should(dest.exists()).be.false();
		});
	});

	describe('#move()', function () {
		it('is a function', function () {
			const file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
			should(file.move).be.a.Function();
		});

		it('moves file within same directory', function () {
			// const appDataDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory);
			// FIXME Move to a different directory!
			const destPath = Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + 'moved.txt';
			const dest = Ti.Filesystem.getFile(destPath);
			const fileATxt = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fileA.txt');

			// ensure fileA.txt and moved.txt don't exist!
			if (dest.exists()) {
				dest.deleteFile();
			}
			if (fileATxt.exists()) {
				fileATxt.deleteFile();
			}

			// write some initial contents
			should(fileATxt.write('text initial ')).be.true();
			should(fileATxt.exists()).be.true();

			// Now move the file
			should(fileATxt.move(destPath)).be.true();

			// Now verify that the original file doesn't exist and the new file does
			should(fileATxt.exists()).be.false();
			should(dest.exists()).be.true();
		});

		it('moves file to another directory', function () {
			const subdir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'subdir');
			const dest = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'subdir', 'moved.txt');
			const fileATxt = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fileA.txt');

			// ensure fileA.txt and moved.txt don't exist!
			if (dest.exists()) {
				dest.deleteFile();
			}
			if (fileATxt.exists()) {
				fileATxt.deleteFile();
			}

			if (!subdir.exists()) {
				should(subdir.createDirectory()).be.true();
			}

			// write some initial contents
			should(fileATxt.write('text initial ')).be.true();
			should(fileATxt.exists()).be.true();

			// Now move the file
			should(fileATxt.move(dest.nativePath)).be.true();

			// Now verify that the original file doesn't exist and the new file does
			should(fileATxt.exists()).be.false();
			should(dest.exists()).be.true();
		});
	});

	describe('#rename()', function () {
		it('is a function', function () {
			const file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
			should(file.rename).be.a.Function();
		});

		it('renames using filename only', function () {
			const sourceFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fileA.txt');
			const newFileName = 'fileA-renamed.txt';
			const destinationFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, newFileName);

			if (destinationFile.exists()) {
				destinationFile.deleteFile();
			}
			if (sourceFile.exists()) {
				sourceFile.deleteFile();
			}

			sourceFile.createFile();
			should(sourceFile.rename(newFileName)).be.true();
			should(sourceFile.exists()).be.false();
			should(destinationFile.exists()).be.true();
		});

		it('renames file within same directory', function () {
			const destPath = Ti.Filesystem.applicationDataDirectory + Ti.Filesystem.separator + 'renamed.txt';
			const dest = Ti.Filesystem.getFile(destPath);
			const fileATxt = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fileA.txt');

			// ensure fileA.txt and renamed.txt don't exist!
			if (dest.exists()) {
				dest.deleteFile();
			}
			if (fileATxt.exists()) {
				fileATxt.deleteFile();
			}

			// write some initial contents
			should(fileATxt.write('text initial ')).be.true();
			should(fileATxt.exists()).be.true();

			// Now rename the file
			should(fileATxt.rename(destPath)).be.true();

			// Now verify that the original file doesn't exist and the new file does
			should(fileATxt.exists()).be.false();
			should(dest.exists()).be.true();
		});

		it('fails to rename file to another directory', function () {
			const subdir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'subdir');
			const dest = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'subdir', 'renamed.txt');
			const fileATxt = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'fileA.txt');

			// ensure fileA.txt and renamed.txt don't exist!
			if (dest.exists()) {
				dest.deleteFile();
			}
			if (fileATxt.exists()) {
				fileATxt.deleteFile();
			}

			if (!subdir.exists()) {
				should(subdir.createDirectory()).be.true();
			}

			// write some initial contents
			should(fileATxt.write('text initial ')).be.true();
			should(fileATxt.exists()).be.true();

			// Now move the file
			should(fileATxt.rename(dest.nativePath)).be.false();

			// Now verify that the original file still exists and the new file doesn't
			should(fileATxt.exists()).be.true();
			should(dest.exists()).be.false();
		});
	});

	describe('#getDirectoryListing()', function () {
		it('is a Function', function () {
			const dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);
			should(dir.getDirectoryListing).be.a.Function();
		});

		it('returns Array of filenames for directory contents', function () {
			const dir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);
			const files = dir.getDirectoryListing();
			should(dir.exists()).be.true();
			files.should.be.an.Array();
			files.length.should.be.above(0);
			files[0].should.be.a.String();
		});

		it('returns empty Array for empty directory', function () {
			const emptyDir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'emptyDir');
			should(emptyDir).be.ok();
			// remove it if it exists
			if (emptyDir.exists()) {
				should(emptyDir.deleteDirectory()).be.true();
			}
			// create a fresh empty dir
			should(emptyDir.createDirectory()).be.true();
			should(emptyDir.exists()).be.true();
			should(emptyDir.isFile()).be.false();
			should(emptyDir.isDirectory()).be.true();

			const result = emptyDir.getDirectoryListing();
			result.should.be.an.Array();
			result.length.should.eql(0);
		});

		it('returns null for non-existent directory', function () {
			const nonExistentDir = Ti.Filesystem.getFile('madeup');
			const result = nonExistentDir.getDirectoryListing();
			should(nonExistentDir).be.ok();
			should(nonExistentDir.exists()).be.false();
			should.not.exist(result); // null or undefined // FIXME: ios returns undefined, test checked for exactly null before
		});

		it('returns null for file', function () {
			const file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'app.js');
			const result = file.getDirectoryListing();
			should(file).be.ok();
			should(file.exists()).be.true();
			should(file.isFile()).be.true();
			should.not.exist(result); // null or undefined // FIXME: ios returns undefined, test checked for exactly null before
		});

		it.windowsBroken('can access resource directory files', function () {
			const rootDir = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory);

			should(rootDir.exists()).be.true();
			should(rootDir.getDirectoryListing).be.a.Function();
			should(rootDir.getDirectoryListing()).be.an.Array();

			// Traverse entire Resources directory tree looking for files/directories in "filesFound".
			const rootPath = rootDir.nativePath;

			const filesFound = {};
			// FIXME: If this is ios and the JS files are encrypted, we cannot get the resource dir listing properly
			// See TIMOB-27646 - encrypted JS files won't be in the listing
			if (!isIOS || !Ti.App.Properties.getBool('js.encrypted', false)) {
				filesFound[rootPath + 'app.js'] = false;
				filesFound[rootPath + 'fixtures' + Ti.Filesystem.separator] = false; // Subdirectory containing only JS files.
				filesFound[rootPath + 'fixtures' + Ti.Filesystem.separator + 'empty-double.js'] = false;
			}
			filesFound[rootPath + 'ti.ui.webview.test.html'] = false;
			filesFound[rootPath + 'txtFiles' + Ti.Filesystem.separator] = false; // Subdirectory containing only assets.
			filesFound[rootPath + 'txtFiles' + Ti.Filesystem.separator + 'text.txt'] = false;
			function searchFileTree(file) {
				if (!file) {
					return;
				}

				const fileList = file.getDirectoryListing();
				if (!fileList) {
					return;
				}

				for (let index = 0; index < fileList.length; index++) {
					const nextFile = Ti.Filesystem.getFile(file.nativePath, fileList[index]);
					if (!nextFile) {
						continue;
					}

					const absolutePath = nextFile.nativePath;
					Ti.API.debug(absolutePath);
					if (absolutePath in filesFound) {
						filesFound[absolutePath] = true;
					}
					searchFileTree(nextFile);
				}
			}
			searchFileTree(rootDir);
			for (let key in filesFound) {
				Ti.API.info(`Checking if found file: ${key}`);
				should(filesFound[key]).be.true(key);
			}
		});
	});

	// TIMOB-19128
	it('#createDirectory() is recursive', function () {
		const dir = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'sub', 'dir2');
		should(dir.exists()).be.false();
		should(dir.createDirectory()).be.true();
		should(dir.exists()).be.true(); // iOS returns false!
		should(dir.deleteDirectory()).be.true();
		should(dir.exists()).be.false();
	});

	// TIMOB-14364
	// FIXME: This pops a prompt dialog for permission to Documents folder on macOS
	it.ios('#setRemoteBackup()', function () {
		if (utilities.isMacOS()) {
			return;
		}
		should(function () {
			Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory).setRemoteBackup(false);
		}).not.throw();
	});

	it.android('externalCacheDirectory read/write', () => {
		if (!Ti.Filesystem.isExternalStoragePresent()) {
			return;
		}
		const stringContent = 'My external file content.';
		const file = Ti.Filesystem.getFile(Ti.Filesystem.externalCacheDirectory, 'MyFile.txt');
		should(file.write(stringContent)).be.true();
		should(file.read().text).be.eql(stringContent);
	});

	it.android('externalStorageDirectory read/write', () => {
		if (!Ti.Filesystem.isExternalStoragePresent()) {
			return;
		}
		const stringContent = 'My external file content.';
		const file = Ti.Filesystem.getFile(Ti.Filesystem.externalStorageDirectory, 'MyFile.txt');
		should(file.write(stringContent)).be.true();
		should(file.read().text).be.eql(stringContent);
	});

	it.android('TIMOB-27193', () => {
		const filename = `TIMOB-27193_${Date.now()}.txt`;
		const file = Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory, filename);
		const originalPath = file.nativePath;
		file.createFile();
		should(file.exists()).be.true();
		// make sure we're not getting swindled by having the underlying file inside the proxy get changed on us!
		should(file.nativePath).eql(originalPath);
	});

	it.android('handles URIs with no scheme', () => {
		// If we use file: URIs without file://, it messes up the ability to copy/move files without fix for TIMOB-27191
		// This is important because the node shim for 'path' will generate file: style URIs when joining tempDir on Android with other relative paths
		const src = Ti.Filesystem.getFile(`file:${Ti.Filesystem.tempDirectory.substring(7)}/renameSync${Date.now()}`);
		should(src.createFile()).be.true();
		const dest = `file:${Ti.Filesystem.tempDirectory.substring(7)}/renameSync-renamed-${Date.now()}`;
		src.move(dest);

		const destFile = Ti.Filesystem.getFile(dest);

		should(src.exists()).be.false(); // returns true
		should(destFile.exists()).be.true();
	});

	// FIXME: macOS pops a permission prompt for Documents folder
	describe.macAndWindowsBroken('constructed via URIs', () => {
		let noSchemeTempAppJS;
		let fileURI;
		before(() => {
			const appJSURI = isIOS ? 'app.js' : 'app://app.js'; // iOS doesn't support app: uris!
			const appJS = Ti.Filesystem.getFile(appJSURI);

			// Generate a file:// URI for the temp dir. Android reports one as-is, iOS reports an absolute filepath so we pre-pend file:// to it
			// file:///data/user/0/com.appcelerator.testApp.testing/cache/_tmp on Android
			// Note also, that IOS reports trailing slash, Android does not
			const prefix = isIOS ? `file://${Ti.Filesystem.tempDirectory}` : `${Ti.Filesystem.tempDirectory}/`;
			fileURI = `${prefix}app.js`;
			console.log(`Copying app.js to ${fileURI}`);
			appJS.copy(fileURI);
			noSchemeTempAppJS = fileURI.substring(7); // should be /data/user/0/com.appcelerator.testApp.testing/cache/_tmp/app.js
			console.log(`Copy's file path should be: ${noSchemeTempAppJS}`);

			const appDataPrivateJS = `${Ti.Filesystem.applicationDataDirectory}/appdata-private.js`;
			appJS.copy(appDataPrivateJS);
			console.log(`Copying app.js to ${appDataPrivateJS}`);
		});

		it('file:// absolute path', () => {
			const file = Ti.Filesystem.getFile(fileURI);
			should.exist(file);
			should(file.exists()).be.true(); // FIXME: Fails on Android, but only if run as part of full suite!
		});

		it.androidAndIosBroken('file:// relative path', () => {
			// FIXME: Android seems to basically forcibly place '/' in front of paths not beginning with '..' or '/'
			// FIXME: iOS does not seem to try and resolve relative paths for file:// URIs
			const file = Ti.Filesystem.getFile('file://app.js'); // app.js should be relative to this file...
			should.exist(file);
			should(file.exists()).be.true();
		});

		it.androidAndIosBroken('file: relative path', () => {
			// FIXME: iOS does not seem to support file: URIs without file:// (see FilesystemModule.m, line 38)
			// FIXME: Android ends up calling startsWith on a null String reference (likely TiFileProxy.java, line 73)
			const file = Ti.Filesystem.getFile('file:app.js');
			should.exist(file);
			should(file.exists()).be.true();
		});

		it.iosBroken('file: absolute path', () => {
			// FIXME: iOS does not seem to support file: URIs without file:// (see FilesystemModule.m, line 38)
			const file = Ti.Filesystem.getFile(`file:${noSchemeTempAppJS}`);
			should.exist(file);
			should(file.exists()).be.true(); // FIXME: Fails on Android, but only if run as part of full suite!
		});

		it.androidBroken('no scheme - absolute path', () => {
			// FIXME: Failing! Likely because getFile() assumes appdata-private scheme if none given!
			// Whereas my fix was in TiFileFactory, used internally by webview, database, file.move(), file.copy()
			const file = Ti.Filesystem.getFile(noSchemeTempAppJS);
			should.exist(file);
			should(file.exists()).be.true();
		});

		it('no scheme - relative path', () => {
			const file = Ti.Filesystem.getFile('app.js');
			should.exist(file);
			should(file.exists()).be.true();
		});

		// TODO: appdata-private:// (which getFile assumes if no scheme!)
		it.android('appdata-private://', () => {
			const file = Ti.Filesystem.getFile('appdata-private://appdata-private.js');
			should.exist(file);
			should(file.exists()).be.true();
		});

		it.android('content:// - assets', () => {
			// Verify we can read asset file within APK via "content://" and our Java "TiFileProvider" class.
			const url = `content://${Ti.App.id}.tifileprovider/assets/Resources/image folder/Logo.png`;
			const file = Ti.Filesystem.getFile(url);
			should.exist(file);
			should(file.exists()).be.true();
			should(file.nativePath).be.eql(url);
			should(file.name).be.eql('Logo.png');
			should(file.extension()).be.eql('png');
			should(file.size).be.above(0);
			should(file.createdAt().getTime()).be.above(0);
			should(file.modifiedAt().getTime()).be.above(0);
			should(file.readonly).be.true();
			should(file.writable).be.false();
			should(file.isDirectory()).be.false();
			should(file.isFile()).be.true();
			const blob = file.read();
			should(blob).be.ok(); // not null or undefined.
			should(blob.width).be.eql(150);
			should(blob.height).be.eql(150);
		});

		it.android('content:// - filesystem', () => {
			// Create a new text file in the file-system.
			const nativeFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'ContentUriTest.txt');
			if (nativeFile.exists()) {
				nativeFile.deleteFile();
			}
			const text = 'This is a test.';
			nativeFile.write(text);

			// Verify we can access above file via "content://" and our Java "TiFileProvider" class.
			const absolutePath = nativeFile.nativePath.replace('file://', '');
			const url = `content://${Ti.App.id}.tifileprovider/filesystem${absolutePath}`;
			const contentFile = Ti.Filesystem.getFile(url);
			should.exist(contentFile);
			should(contentFile.exists()).be.true();
			should(contentFile.nativePath).be.eql(url);
			should(contentFile.name).be.eql(nativeFile.name);
			should(contentFile.extension()).be.eql(nativeFile.extension());
			should(contentFile.size).be.eql(nativeFile.size);
			should(contentFile.createdAt().getTime()).be.eql(nativeFile.createdAt().getTime());
			should(contentFile.modifiedAt().getTime()).be.eql(nativeFile.modifiedAt().getTime());
			should(contentFile.readonly).be.false();
			should(contentFile.writable).be.true();
			should(contentFile.isDirectory()).be.false();
			should(contentFile.isFile()).be.true();
			const contentBlob = contentFile.read();
			should(contentBlob).be.ok(); // not null or undefined.
			should(contentBlob.text).be.eql(text);

			// Verify we can write to the file via "content://".
			should(contentFile.write('Hello')).be.true();
			should(contentFile.read().text).be.eql('Hello');
			should(contentFile.write(' World', true)).be.true();
			should(contentFile.read().text).be.eql('Hello World');
		});

		it.iosBroken('app:// - absolute path', () => {
			// FIXME: iOS doesn't support app: URIs in getFile!
			const file = Ti.Filesystem.getFile('app:///app.js');
			should.exist(file);
			should(file.exists()).be.true();
		});

		it.iosBroken('app:// - relative path', () => {
			// FIXME: iOS doesn't support app: URIs in getFile!
			const file = Ti.Filesystem.getFile('app://app.js');
			should.exist(file);
			should(file.exists()).be.true();
		});

		it.android('android.resource://', () => {
			const file = Ti.Filesystem.getFile(`android.resource://${Ti.App.id}/drawable/appicon`);
			should.exist(file);
			should(file.exists()).be.true();
		});

		it.android('file:///android_asset absolute path', () => {
			const file = Ti.Filesystem.getFile('file:///android_asset/Resources/txtFiles/file.txt');
			should.exist(file);
			should(file.exists()).be.true();
		});
	});
});
