/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint node/no-deprecated-api: "off" */
/* eslint node/no-unsupported-features/node-builtins: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');
const path = require('path');

const IS_IOS = utilities.isIOS();
const IS_ENCRYPTED = Ti.App.deployType === 'test';

/**
 * Just using __filename fails at least on iOS, I don't think we support assumption of resources dir by default for absolute paths!
 */
// eslint-disable-next-line no-path-concat
const thisFilePath = Ti.Filesystem.resourcesDirectory + __filename;
const thisFile = Ti.Filesystem.getFile(thisFilePath);

let fs;

describe('fs', function () {
	it('is required as a core module', () => {
		fs = require('fs');
		should(fs).be.ok;
	});

	describe('.constants', () => {
		it('is an object', () => {
			should(fs.constants).be.an.Object();
		});

		it('.F_OK equals 0', () => {
			should(fs.constants.F_OK).eql(0);
		});

		it('.R_OK equals 4', () => {
			should(fs.constants.R_OK).eql(4);
		});

		it('.W_OK equals 2', () => {
			should(fs.constants.W_OK).eql(2);
		});

		it('.X_OK equals 1', () => {
			should(fs.constants.X_OK).eql(1);
		});
	});

	describe('#access()', () => {
		it('is a function', () => {
			should(fs.access).be.a.Function();
		});

		it('checks that this file exists properly', finished => {
			fs.access(thisFilePath, fs.constants.F_OK, err => {
				finished(err);
			});
		});

		it('throws when trying to access file that doesn\'t exist', finished => {
			fs.access('/madeup', err => {
				try {
					should(err).be.ok; // aka, there is an error
					// TODO Verify the error.code value is EACCESS!
					finished();
				} catch (e) {
					finished(e);
				}
			});
		});

		it('uses mode F_OK by default', finished => {
			fs.access(thisFilePath, err => {
				finished(err);
			});
		});

		it('checks that this file is readable properly', finished => {
			fs.access(thisFilePath, fs.constants.R_OK, err => {
				finished(err);
			});
		});

		it('checks that this file is NOT writable properly', finished => {
			fs.access(thisFilePath, fs.constants.W_OK, err => {
				try {
					should(err).be.ok; // aka, there is an error
					// TODO Verify the error.code value is EACCESS!
					finished();
				} catch (e) {
					finished(e);
				}
			});
		});

		it('checks that this file is NOT executable properly', finished => {
			fs.access(thisFilePath, fs.constants.X_OK, err => {
				try {
					should(err).be.ok; // aka, there is an error
					// TODO Verify the error.code value is EACCESS!
					finished();
				} catch (e) {
					finished(e);
				}
			});
		});
	});

	describe('#accessSync()', () => {
		it('is a function', () => {
			should(fs.accessSync).be.a.Function();
		});

		it('checks that this file exists properly', () => {
			fs.accessSync(thisFilePath, fs.constants.F_OK);
		});

		it('throws when trying to access file that doesn\'t exist', () => {
			should.throws(() => {
				fs.accessSync('/madeup');
			}, Error);
			// TODO: Verify format of error!
		});

		it('uses mode F_OK by default', () => {
			fs.accessSync(thisFilePath);
		});

		it('checks that this file is readable properly', () => {
			fs.accessSync(thisFilePath, fs.constants.R_OK);
		});

		it.allBroken('checks that this file is NOT writable properly', () => {
			// FIXME: This isn't throwing an error like we expect!
			// How can we test this? resourcesDirectory is not supposed to be writable on device, but can be on simulator.
			// (and this may be platform-specific behavior)
			should.throws(() => {
				fs.accessSync(thisFilePath, fs.constants.W_OK);
			}, Error);
			// TODO Verify the error.code value is EACCESS!
		});

		it.windowsDesktopBroken('checks that this file is NOT executable properly', () => {
			should.throws(() => {
				fs.accessSync(thisFilePath, fs.constants.X_OK);
			}, Error); // Windows desktop doesn't throw
			// TODO Verify the error.code value is EACCESS!
		});
	});

	// TODO: #appendFile()

	describe('#appendFileSync()', () => {
		it('is a function', () => {
			should(fs.appendFileSync).be.a.Function();
		});
	});

	// TODO: #close()

	describe('#closeSync()', () => {
		it('is a function', () => {
			should(fs.closeSync).be.a.Function();
		});

		it('returns undefined', () => {
			const fd = fs.openSync(thisFilePath);
			const result = fs.closeSync(fd);
			should(result).be.undefined();
		});
	});

	describe('#copyFile()', () => {
		it('is a function', () => {
			should(fs.copyFile).be.a.Function();
		});

		it('copies file asynchronously to destination', function (finished) {
			this.slow(2000);
			this.timeout(5000);

			const dest = path.join(Ti.Filesystem.tempDirectory, 'fs.addontest.js');
			// ensure file doesn't already exist
			const destFile = Ti.Filesystem.getFile(dest);
			if (destFile.exists()) {
				should(destFile.deleteFile()).eql(true);
			}
			should(destFile.exists()).eql(false);

			fs.copyFile(thisFilePath, dest, err => {
				try {
					should(err).not.be.ok;
					fs.existsSync(dest).should.eql(true);
					// TODO: Read in the file and compare contents? Check filesize matches?
					finished();
				} catch (e) {
					finished(e);
				}
			});
		});
	});

	describe('#copyFileSync()', () => {
		it('is a function', () => {
			should(fs.copyFileSync).be.a.Function();
		});

		it('copies file synchronously to destination', () => {
			const dest = Ti.Filesystem.tempDirectory + 'fs.addontest.js';
			// ensure file doesn't already exist
			const destFile = Ti.Filesystem.getFile(dest);
			if (destFile.exists()) {
				should(destFile.deleteFile()).eql(true);
			}
			should(destFile.exists()).eql(false);

			fs.copyFileSync(thisFilePath, dest);
			fs.existsSync(dest).should.eql(true);
			// TODO: Read in the file and compare contents? Check filesize matches?
		});

		// TODO: Check that we fail if file already exists with flag fs.constants.COPYFILE_EXCL
		// TODO: Check that we overwrite byudefault if file already exists without flag
	});

	describe('#exists()', () => {
		it('is a function', () => {
			should(fs.exists).be.a.Function();
		});

		it('checks that this file exists properly', finished => {
			fs.exists(thisFilePath, exists => {
				try {
					exists.should.eql(true);
					finished();
				} catch (e) {
					finished(e);
				}
			});
		});

		it('checks that non-existent file returns false', finished => {
			fs.exists('/some/made/up/path', exists => {
				try {
					exists.should.eql(false);
					finished();
				} catch (e) {
					finished(e);
				}
			});
		});
	});

	describe('#existsSync()', () => {
		it('is a function', () => {
			should(fs.existsSync).be.a.Function();
		});

		it('checks that this file exists properly', () => {
			fs.existsSync(thisFilePath).should.eql(true);
		});

		it('checks that non-existent file returns false', () => {
			fs.existsSync('/some/made/up/path').should.eql(false);
		});
	});

	describe('#mkdir()', () => {
		it('is a function', () => {
			should(fs.mkdir).be.a.Function();
		});

		it('creates directory of depth 0', finished => {
			const dirPath = path.join(Ti.Filesystem.tempDirectory, `mkdir${Date.now()}`);
			should(fs.existsSync(dirPath)).eql(false); // should not exist first!
			should(fs.existsSync(Ti.Filesystem.tempDirectory)).eql(true); // parent should exist first!
			fs.mkdir(dirPath, err => {
				try {
					should.not.exist(err);
					should(fs.existsSync(dirPath)).eql(true);
				} catch (e) {
					finished(e);
					return;
				}
				finished();
			});
		});

		it('creates recursively if passed option to', finished => {
			const subdirPath = path.join(Ti.Filesystem.tempDirectory, `mkdir_r_${Date.now()}`, 'subdir');
			should(fs.existsSync(subdirPath)).eql(false); // should not exist first!
			should(fs.existsSync(path.dirname(subdirPath))).eql(false); // parent should not exist first!
			fs.mkdir(subdirPath, { recursive: true }, err => {
				try {
					should.not.exist(err);
					should(fs.existsSync(subdirPath)).eql(true);
				} catch (e) {
					finished(e);
					return;
				}
				finished();
			});
		});

		it.windowsDesktopBroken('does not create recursively by default', finished => {
			const subdirPath = path.join(Ti.Filesystem.tempDirectory, `mkdir_r2_${Date.now()}`, 'subdir');
			should(fs.existsSync(subdirPath)).eql(false); // should not exist first!
			should(fs.existsSync(path.dirname(subdirPath))).eql(false); // parent should not exist first!
			fs.mkdir(subdirPath, err => {
				try {
					should.exist(err);
					err.name.should.eql('Error'); // windows desktop fails here (because error is null)
					err.message.should.eql(`ENOENT: no such file or directory, mkdir '${subdirPath}'`);
					err.code.should.eql('ENOENT');
					err.errno.should.eql(-2);
					err.syscall.should.eql('mkdir');
					err.path.should.eql(subdirPath);
					should(fs.existsSync(subdirPath)).eql(false);
				} catch (e) {
					finished(e);
					return;
				}
				finished();
			});
		});
	});

	describe('#mkdirSync()', () => {
		it('is a function', () => {
			should(fs.mkdirSync).be.a.Function();
		});

		it('creates directory of depth 0', () => {
			const dirPath = path.join(Ti.Filesystem.tempDirectory, `mkdirSync${Date.now()}`);
			should(fs.existsSync(dirPath)).eql(false); // should not exist first!
			should(fs.existsSync(Ti.Filesystem.tempDirectory)).eql(true); // parent should exist first!
			fs.mkdirSync(dirPath);
			should(fs.existsSync(dirPath)).eql(true);
		});

		it('creates recursively if passed option to', () => {
			const subdirPath = path.join(Ti.Filesystem.tempDirectory, `mkdirSync_r_${Date.now()}`, 'subdir');
			should(fs.existsSync(subdirPath)).eql(false); // should not exist first!
			should(fs.existsSync(path.dirname(subdirPath))).eql(false); // parent should not exist first!
			fs.mkdirSync(subdirPath, { recursive: true });
			should(fs.existsSync(subdirPath)).eql(true);
		});

		it.windowsDesktopBroken('does not create recursively by default', () => {
			const subdirPath = path.join(Ti.Filesystem.tempDirectory, `mkdirSync_r2_${Date.now()}`, 'subdir');
			should(fs.existsSync(subdirPath)).eql(false); // should not exist first!
			should(fs.existsSync(path.dirname(subdirPath))).eql(false); // parent should not exist first!

			try {
				fs.mkdirSync(subdirPath);
				should.fail(true, false, 'expected fs.mkdirSync to throw Error when parent does not exist and not recursive');
			} catch (err) {
				err.name.should.eql('Error'); // Windows desktop fails here (because block threw AssertionError)
				err.message.should.eql(`ENOENT: no such file or directory, mkdir '${subdirPath}'`);
				err.code.should.eql('ENOENT');
				err.errno.should.eql(-2);
				err.syscall.should.eql('mkdir');
				err.path.should.eql(subdirPath);
			}
			should(fs.existsSync(subdirPath)).eql(false);
		});

		it('throws Error when trying to create a directory that exists', () => {
			const targetPath = Ti.Filesystem.tempDirectory;
			should(fs.existsSync(targetPath)).eql(true); // should exist first!

			try {
				fs.mkdirSync(targetPath);
				should.fail(true, false, 'expected fs.mkdirSync to throw Error when trying to create directory that exists');
			} catch (err) {
				err.name.should.eql('Error');
				err.message.should.eql(`EEXIST: file already exists, mkdir '${targetPath}'`);
				err.code.should.eql('EEXIST');
				err.errno.should.eql(-17);
				err.syscall.should.eql('mkdir');
				err.path.should.eql(targetPath);
			}
		});

		it('does not throw Error when trying to create a directory that exists if recursive option is true', () => {
			const targetPath = Ti.Filesystem.tempDirectory;
			should(fs.existsSync(targetPath)).eql(true); // should exist first!
			should.doesNotThrow(() => {
				fs.mkdirSync(targetPath, { recursive: true });
			}, Error);
		});
	});

	// TODO: #mkdtemp()

	describe('#mkdtempSync()', () => {
		it('is a function', () => {
			should(fs.mkdtempSync).be.a.Function();
		});

		it('creates directory of depth 0', () => {
			const prefix = path.join(Ti.Filesystem.tempDirectory, `mkdtempSync${Date.now()}-`);
			const result = fs.mkdtempSync(prefix);
			should(result.startsWith(prefix)).eql(true);
			should(result).have.length(prefix.length + 6); // 6 characters appended
		});

		it('throws with non-string prefix', () => {
			should.throws(() => {
				fs.mkdtempSync(123);
			}, TypeError);
		});
	});

	describe('#openSync()', () => {
		it('is a function', () => {
			should(fs.openSync).be.a.Function();
		});

		it('returns integer representing file descriptor', () => {
			const fd = fs.openSync(thisFilePath);
			try {
				should(fd).be.a.Number();
				should(fd).be.above(2); // 0, 1, 2 are typical stdin/stdout/stderr numbers
			} finally {
				fs.closeSync(fd);
			}
		});

		// TODO: Test with file: URL
		// TODO: Test with Buffer?!
	});

	describe('#readdir()', () => {
		it('is a function', () => {
			should(fs.readdir).be.a.Function();
		});

		it('returns listing for this directory', finished => {
			fs.readdir(Ti.Filesystem.resourcesDirectory, (err, files) => {
				try {
					should(files).be.an.Array();
					should(files.length).be.greaterThan(1); // it should have some files, man
					if (IS_IOS && IS_ENCRYPTED) {
						should(files).containEql('Info.plist');
					} else {
						should(files).containEql('app.js');
					}

					finished();
				} catch (e) {
					finished(e);
				}
			});
		});

		it('returns Buffers for listing for this directory if encoding === "buffer"', finished => {
			fs.readdir(Ti.Filesystem.resourcesDirectory, { encoding: 'buffer' }, (err, files) => {
				try {
					should(files).be.an.Array();
					should(files.length).be.greaterThan(1); // it should have some files, man
					if (IS_IOS && IS_ENCRYPTED) {
						should(files).containEql(Buffer.from('Info.plist'));
					} else {
						should(files).containEql(Buffer.from('app.js'));
					}

					finished();
				} catch (e) {
					finished(e);
				}
			});
		});

		it('returns Error for non-existent path', finished => {
			fs.readdir('/fake/path', (err, files) => {
				try {
					should(err).be.ok; // aka we have an error
					should(err.message).startWith('ENOENT: no such file or directory');
					should(files).not.be.ok; // no files listing

					finished();
				} catch (e) {
					finished(e);
				}
			});
		});

		it('returns Error for file path', finished => {
			fs.readdir(thisFilePath, (err, files) => {
				try {
					should(err).be.ok; // aka we have an error
					should(err.message).startWith('ENOTDIR: not a directory, scandir');
					should(files).not.be.ok; // no files listing

					finished();
				} catch (e) {
					finished(e);
				}
			});
		});
	});

	describe('#readdirSync()', () => {
		it('is a function', () => {
			should(fs.readdirSync).be.a.Function();
		});

		it('returns listing for this directory', () => {
			const files = fs.readdirSync(Ti.Filesystem.resourcesDirectory);
			should(files).be.an.Array();
			should(files.length).be.greaterThan(1); // it should have some files, man

			if (IS_IOS && IS_ENCRYPTED) {
				should(files).containEql('Info.plist');
			} else {
				should(files).containEql('app.js');
			}
		});

		it('returns Buffers for listing for this directory if encoding === "buffer"', () => {
			const files = fs.readdirSync(Ti.Filesystem.resourcesDirectory, { encoding: 'buffer' });
			should(files).be.an.Array();
			should(files.length).be.greaterThan(1); // it should have some files, man

			if (IS_IOS && IS_ENCRYPTED) {
				should(files).containEql(Buffer.from('Info.plist'));
			} else {
				should(files).containEql(Buffer.from('app.js'));
			}
		});

		it('returns Error for non-existent path', () => {
			try {
				fs.readdirSync('/fake/path');
				should.fail(true, false, 'expected fs.readdirSync to throw Error when path does not exist');
			} catch (err) {
				should(err).be.ok; // aka we have an error
				should(err.message).startWith('ENOENT: no such file or directory');
			}
		});

		it('returns Error for file path', () => {
			try {
				fs.readdirSync(thisFilePath);
				should.fail(true, false, 'expected fs.readdirSync to throw Error when path is a file');
			} catch (err) {
				should(err).be.ok; // aka we have an error
				should(err.message).startWith('ENOTDIR: not a directory, scandir');
			}
		});
	});

	describe('#readFile()', () => {
		it('is a function', () => {
			should(fs.readFile).be.a.Function();
		});

		it('returns Buffer when no encoding set', finished => {
			fs.readFile(thisFilePath, (err, result) => {
				should.not.exist(err);
				should(result).not.be.a.String();
				finished();
			});
		});

		it('returns String when utf-8 encoding set via second argument', finished => {
			fs.readFile(thisFilePath, 'utf-8', (err, result) => {
				should.not.exist(err);
				should(result).be.a.String();
				finished();
			});
		});

		it('returns String when utf-8 encoding set via options object argument', finished => {
			fs.readFile(thisFilePath, { encoding: 'utf-8' }, (err, result) => {
				should.not.exist(err);
				should(result).be.a.String();
				finished();
			});
		});
	});

	describe('#readFileSync()', () => {
		it('is a function', () => {
			should(fs.readFileSync).be.a.Function();
		});

		it('returns Buffer when no encoding set', () => {
			const result = fs.readFileSync(thisFilePath);
			should(result).not.be.a.String();
		});

		it('returns String when utf-8 encoding set via second argument', () => {
			const result = fs.readFileSync(thisFilePath, 'utf-8');
			should(result).be.a.String();
		});

		it('returns String when utf-8 encoding set via options object argument', () => {
			const result = fs.readFileSync(thisFilePath, { encoding: 'utf-8' });
			should(result).be.a.String();
		});
	});

	describe('#read()', () => {
		it('is a function', () => {
			should(fs.read).be.a.Function();
		});

		it('reads 10 bytes of this file', finished => {
			const origBuffer = Buffer.alloc(123);
			const fd = fs.openSync(thisFilePath);
			fs.read(fd, origBuffer, 0, 10, null, (err, bytesRead, buffer) => {
				try {
					fs.closeSync(fd);
					should.not.exist(err);
					should(bytesRead).eql(10);
					should(buffer).eql(origBuffer);
				} catch (e) {
					return finished(e);
				}
				finished();
			});
		});
	});

	describe('#readSync()', () => {
		it('is a function', () => {
			should(fs.readSync).be.a.Function();
		});

		it('reads 10 bytes of this file', finished => {
			const origBuffer = Buffer.alloc(123);
			const fd = fs.openSync(thisFilePath);
			try {
				const bytesRead = fs.readSync(fd, origBuffer, 0, 10, null);
				should(bytesRead).eql(10);
			} catch (e) {
				return finished(e);
			} finally {
				fs.closeSync(fd);
			}
			finished();
		});
	});

	describe('#realpath()', () => {
		it('is a function', () => {
			should(fs.realpath).be.a.Function();
		});

		it('normalizes .', finished => {
			// FIXME: On Android, Ti.Filesystem.resourcesDirectory gives us something like "app://", which blows this up!
			fs.realpath('node_modules/.', (err, result) => {
				try {
					should.not.exist(err);
					result.should.eql('node_modules');
				} catch (e) {
					return finished(e);
				}
				finished();
			});
		});

		it('normalizes ..', finished => {
			fs.realpath('node_modules/abbrev/..', (err, result) => {
				try {
					should.not.exist(err);
					result.should.eql('node_modules');
				} catch (e) {
					return finished(e);
				}
				finished();
			});
		});

		it('throws an Error if path doesn\'t exist', finished => {
			fs.realpath('/madeup/path', (err, _result) => {
				try {
					should.exist(err);
					const pathValue = utilities.isWindows() ? '\\madeup' : '/madeup';
					should(err).have.properties({
						syscall: 'lstat',
						code: 'ENOENT',
						path: pathValue,
						errno: -2,
						message: `ENOENT: no such file or directory, lstat '${pathValue}'`
					});
				} catch (e) {
					return finished(e);
				}
				finished();
			});
		});
	});

	describe('#realpathSync()', () => {
		it('is a function', () => {
			should(fs.realpath).be.a.Function();
		});

		it('normalizes .', () => {
			const result = fs.realpathSync('node_modules/.');
			result.should.eql('node_modules');
		});

		it('normalizes ..', () => {
			const result = fs.realpathSync('node_modules/abbrev/..');
			result.should.eql('node_modules');
		});

		it('throws an Error if path doesn\'t exist', () => {
			try {
				fs.realpathSync('/madeup/path');
				should.fail(true, false, 'expected fs.realpathSync to throw Error when path does not exist');
			} catch (err) {
				const pathValue = utilities.isWindows() ? '\\madeup' : '/madeup';
				should(err).have.properties({
					syscall: 'lstat',
					code: 'ENOENT',
					path: pathValue,
					errno: -2,
					message: `ENOENT: no such file or directory, lstat '${pathValue}'`
				});
			}
		});
	});

	describe('#rename()', () => {
		it('is a function', () => {
			should(fs.rename).be.a.Function();
		});
		// TODO: Try renaming to existing file/dir
		// TODO: What other error conditions can we test? rename into path we don't have permissions?
	});

	describe('#renameSync()', () => {
		it('is a function', () => {
			should(fs.renameSync).be.a.Function();
		});

		it('renames a file', () => {
			// create a source file
			const file = path.join(Ti.Filesystem.tempDirectory, `renameSync${Date.now()}`);
			fs.writeFileSync(file);
			should(fs.existsSync(file)).eql(true);

			// make sure destiantion doesn't exist
			const newFile = path.join(Ti.Filesystem.tempDirectory, `renameSync-renamed-${Date.now()}`);
			should(fs.existsSync(newFile)).eql(false);

			// rename
			fs.renameSync(file, newFile);

			// source no longer exists, but dest does
			should(fs.existsSync(file)).eql(false);
			should(fs.existsSync(newFile)).eql(true);
		});

		// TODO: It appears that node's fs.renameSync is happy to rename a file to a destination name even if the destination already exists!
		// I assume we won't...?
		it('does not throw trying to rename to existing file', () => {
			// create first file
			const file = path.join(Ti.Filesystem.tempDirectory, `renameSync_1_${Date.now()}`);
			fs.writeFileSync(file, 'yup');
			should(fs.existsSync(file)).eql(true);

			// create destination file
			const existingFile = path.join(Ti.Filesystem.tempDirectory, `renameSync_2_${Date.now()}`);
			fs.writeFileSync(existingFile, 'hi there');
			should(fs.existsSync(existingFile)).eql(true);

			// rename from source to dest (even though it already exists!)
			fs.renameSync(file, existingFile);

			// source no longer exists, but dest does
			should(fs.existsSync(file)).eql(false);
			should(fs.existsSync(existingFile)).eql(true);
		});

		it('throws trying to rename to existing directory', () => {
			// create first file
			const file = path.join(Ti.Filesystem.tempDirectory, `renameSync_5_${Date.now()}`);
			fs.writeFileSync(file);
			should(fs.existsSync(file)).eql(true);

			// create destination dir path
			const existingDir = path.join(Ti.Filesystem.tempDirectory, `renameSync_6_${Date.now()}`);
			fs.mkdirSync(existingDir);
			should(fs.existsSync(existingDir)).eql(true);

			try {
				fs.renameSync(file, existingDir);
				should.fail(true, false, 'expected fs.renameSync to throw Error when renaming to existing directory');
			} catch (error) {
				should.exist(error);
				error.name.should.eql('Error');
				error.message.should.eql(`EISDIR: illegal operation on a directory, rename '${file}' -> '${existingDir}'`);
				error.code.should.eql('EISDIR');
				error.errno.should.eql(-21);
				error.syscall.should.eql('rename');
				error.path.should.eql(file);
				error.dest.should.eql(existingDir);
			}
			// Both files should still exist
			should(fs.existsSync(file)).eql(true);
			should(fs.existsSync(existingDir)).eql(true);
		});

		it('throws trying to rename from non-existent source path', () => {
			// make up a source path that doesn't exist
			const file = path.join(Ti.Filesystem.tempDirectory, `renameSync_3_${Date.now()}`);
			should(fs.existsSync(file)).eql(false);

			const destFile = path.join(Ti.Filesystem.tempDirectory, `renameSync_4_${Date.now()}`);
			try {
				fs.renameSync(file, destFile);
				should.fail(true, false, 'expected fs.renameSync to throw Error when renaming to existing file');
			} catch (error) {
				should.exist(error);
				error.name.should.eql('Error');
				error.message.should.eql(`ENOENT: no such file or directory, rename '${file}' -> '${destFile}'`);
				error.code.should.eql('ENOENT');
				error.errno.should.eql(-2);
				error.syscall.should.eql('rename');
				error.path.should.eql(file);
				error.dest.should.eql(destFile);
			}
		});
	});

	describe('#rmdir()', () => {
		it('is a function', () => {
			should(fs.rmdir).be.a.Function();
		});

		it('deletes directory that is empty', finished => {
			const dirName = path.join(Ti.Filesystem.tempDirectory, `rmdir${Date.now()}`);
			fs.mkdirSync(dirName);
			should(fs.existsSync(dirName)).eql(true);
			fs.rmdir(dirName, err => {
				try {
					should.not.exist(err);
					should(fs.existsSync(dirName)).eql(false);
				} catch (e) {
					return finished(e);
				}
				finished();
			});
		});

		it.windowsDesktopBroken('throws trying to delete directory that is NOT empty', finished => {
			const dirName = path.join(Ti.Filesystem.tempDirectory, `rmdir${Date.now()}`);
			fs.mkdirSync(dirName);
			should(fs.existsSync(dirName)).eql(true);
			const file = path.join(dirName, 'myfile.txt');
			fs.writeFileSync(file, 'Hello World!');
			should(fs.existsSync(file)).eql(true);

			fs.rmdir(dirName, error => {
				try {
					should.exist(error);
					error.name.should.eql('Error'); // windows desktop fails here
					error.message.should.eql(`ENOTEMPTY: directory not empty, rmdir '${dirName}'`);
					error.errno.should.eql(-66);
					error.syscall.should.eql('rmdir');
					error.code.should.eql('ENOTEMPTY');
					error.path.should.eql(dirName);
					should(fs.existsSync(dirName)).eql(true);
				} catch (e) {
					return finished(e);
				}
				finished();
			});
		});

		it('throws trying to remove file instead of directory', finished => {
			fs.rmdir(thisFilePath, error => {
				try {
					should.exist(error);
					error.name.should.eql('Error');
					error.message.should.eql(`ENOTDIR: not a directory, rmdir '${thisFilePath}'`);
					error.errno.should.eql(-20);
					error.syscall.should.eql('rmdir');
					error.code.should.eql('ENOTDIR');
					error.path.should.eql(thisFilePath);
				} catch (e) {
					return finished(e);
				}
				finished();
			});
		});

		it('throws trying to remove non-existent directory', finished => {
			const dirName = '/made/up/path';
			should(fs.existsSync(dirName)).eql(false);

			fs.rmdir(dirName, error => {
				try {
					should.exist(error);
					error.name.should.eql('Error');
					error.message.should.eql(`ENOENT: no such file or directory, rmdir '${dirName}'`);
					error.errno.should.eql(-2);
					error.syscall.should.eql('rmdir');
					error.code.should.eql('ENOENT');
					error.path.should.eql(dirName);
				} catch (e) {
					return finished(e);
				}
				finished();
			});
		});
	});

	describe('#rmdirSync()', () => {
		it('is a function', () => {
			should(fs.rmdirSync).be.a.Function();
		});

		it('deletes directory that is empty', () => {
			const dirName = path.join(Ti.Filesystem.tempDirectory, `rmdirSync${Date.now()}`);
			fs.mkdirSync(dirName);
			should(fs.existsSync(dirName)).eql(true);
			fs.rmdirSync(dirName);
			should(fs.existsSync(dirName)).eql(false);
		});

		it.windowsDesktopBroken('throws trying to delete directory that is NOT empty', () => {
			const dirName = path.join(Ti.Filesystem.tempDirectory, `rmdirSync_2_${Date.now()}`);
			fs.mkdirSync(dirName);
			should(fs.existsSync(dirName)).eql(true);
			const file = path.join(dirName, 'myfile.txt');
			fs.writeFileSync(file, 'Hello World!');
			should(fs.existsSync(file)).eql(true); // FFIXME: Fails on Android

			try {
				fs.rmdirSync(dirName);
				should.fail(true, false, 'expected fs.rmdirSync to throw Error when deleting non-empty directory');
			} catch (error) {
				error.name.should.eql('Error'); // Windows desktop fails here
				error.message.should.eql(`ENOTEMPTY: directory not empty, rmdir '${dirName}'`);
				error.errno.should.eql(-66);
				error.syscall.should.eql('rmdir');
				error.code.should.eql('ENOTEMPTY');
				error.path.should.eql(dirName);
			}
			should(fs.existsSync(dirName)).eql(true);
		});

		it('throws trying to remove file instead of directory', () => {
			try {
				fs.rmdirSync(thisFilePath);
				should.fail(true, false, 'expected fs.rmdirSync to throw Error when deleting file');
			} catch (error) {
				error.name.should.eql('Error');
				error.message.should.eql(`ENOTDIR: not a directory, rmdir '${thisFilePath}'`);
				error.errno.should.eql(-20);
				error.syscall.should.eql('rmdir');
				error.code.should.eql('ENOTDIR');
				error.path.should.eql(thisFilePath);
			}
		});

		it('throws trying to remove non-existent directory', () => {
			const dirName = '/made/up/path';
			should(fs.existsSync(dirName)).eql(false);

			try {
				fs.rmdirSync(dirName);
				should.fail(true, false, 'expected fs.rmdirSync to throw Error when deleting dir that does not exist');
			} catch (error) {
				error.name.should.eql('Error');
				error.message.should.eql(`ENOENT: no such file or directory, rmdir '${dirName}'`);
				error.errno.should.eql(-2);
				error.syscall.should.eql('rmdir');
				error.code.should.eql('ENOENT');
				error.path.should.eql(dirName);
			}
		});
	});

	describe('#stat()', () => {
		it('is a function', () => {
			should(fs.stat).be.a.Function();
		});

		it('returns stats for this file', finished => {
			fs.stat(thisFilePath, (err, stats) => {
				try {
					should(stats).be.ok;
					should(stats).be.an.Object();

					// TODO: Verify some of the values?
					finished();
				} catch (e) {
					finished(e);
				}
			});
		});
	});

	describe('#statSync()', () => {
		it('is a function', () => {
			should(fs.statSync).be.a.Function();
		});

		it('returns stats for this file', () => {
			const stats = fs.statSync(thisFilePath);
			should(stats).be.ok;
			should(stats).be.an.Object();

			stats.size.should.be.above(0);
			stats.blocks.should.be.above(0);

			// check ctime and mtime versus Ti.Filesystem.File modifiedAt/createdAt?
			stats.ctime.should.eql(thisFile.createdAt());
			stats.mtime.should.eql(thisFile.modifiedAt());

			stats.isFile().should.eql(true);
			stats.isDirectory().should.eql(false);
			// TODO Verify isSocket()/isCharacterDevice()/isBlockDevice()/isFIFO()/isSymbolicLink()?
		});
	});

	describe('#truncate()', () => {
		it('is a function', () => {
			should(fs.truncate).be.a.Function();
		});

		it.windowsDesktopBroken('truncates to 0 bytes by default', finished => {
			const dest = Ti.Filesystem.tempDirectory + `truncate_${Date.now()}.js`;
			fs.copyFileSync(thisFilePath, dest);
			fs.truncate(dest, err => {
				try {
					should.not.exist(err);
					fs.readFileSync(dest, 'utf8').should.eql(''); // windows desktop fails here
				} catch (e) {
					return finished(e);
				}
				finished();
			});
		});

		it.windowsDesktopBroken('truncates to specified number of bytes', finished => {
			const dest = Ti.Filesystem.tempDirectory + `truncate_bytes_${Date.now()}.js`;
			fs.copyFileSync(thisFilePath, dest);
			fs.truncate(dest, 16384, err => {
				try {
					should.not.exist(err);
					const buffer = fs.readFileSync(dest);
					buffer.length.should.eql(16384); // windows desktop gives 213231
					// TODO: Compare contents somehow?
				} catch (e) {
					return finished(e);
				}
				finished();
			});
		});
	});

	describe('#truncateSync()', () => {
		it('is a function', () => {
			should(fs.truncateSync).be.a.Function();
		});

		it.windowsDesktopBroken('truncates to 0 bytes by default', () => {
			const dest = Ti.Filesystem.tempDirectory + `truncateSync_${Date.now()}.js`;
			fs.copyFileSync(thisFilePath, dest);
			fs.truncateSync(dest);
			fs.readFileSync(dest, 'utf8').should.eql(''); // windows desktop fails here
		});

		it.windowsDesktopBroken('truncates to specified number of bytes', () => {
			const dest = Ti.Filesystem.tempDirectory + `truncateSync_bytes_${Date.now()}.js`;
			fs.copyFileSync(thisFilePath, dest);
			fs.truncateSync(dest, 16384);
			const buffer = fs.readFileSync(dest);
			buffer.length.should.eql(16384); // windows desktop gives 213231
			// TODO: Compare contents somehow?
		});
	});

	describe('#unlink()', () => {
		it('is a function', () => {
			should(fs.unlink).be.a.Function();
		});

		it('deletes a file', finished => {
			const filename = path.join(Ti.Filesystem.tempDirectory, `unlink${Date.now()}.txt`);
			fs.writeFileSync(filename, 'Hello World!');
			// file should now exist
			should(fs.existsSync(filename)).eql(true);
			// delete it
			fs.unlink(filename, err => {
				try {
					should.not.exist(err);
					// no longer should exist
					should(fs.existsSync(filename)).eql(false);
					finished();
				} catch (e) {
					return finished(e);
				}
			});
		});

		it.windowsDesktopBroken('throws trying to delete a directory', finished => {
			const dir = Ti.Filesystem.tempDirectory;
			// dir should exist
			should(fs.existsSync(dir)).eql(true);
			// try to delete it
			fs.unlink(dir, error => {
				try {
					should.exist(error);
					error.name.should.eql('Error'); // windows fails here
					error.message.should.eql(`EISDIR: illegal operation on a directory, unlink '${dir}'`);
					error.code.should.eql('EISDIR');
					error.errno.should.eql(-21);
					error.syscall.should.eql('unlink');
					error.path.should.eql(dir);
					// should still exist
					should(fs.existsSync(Ti.Filesystem.tempDirectory)).eql(true);
				} catch (e) {
					return finished(e);
				}
				finished();
			});
		});

		it('throws trying to delete a non-existent path', finished => {
			const dir = '/made/up/path';
			// dir should not exist
			should(fs.existsSync(dir)).eql(false);
			// try to delete it
			fs.unlink(dir, error => {
				try {
					should.exist(error);
					error.name.should.eql('Error');
					error.message.should.eql(`ENOENT: no such file or directory, unlink '${dir}'`);
					error.code.should.eql('ENOENT');
					error.errno.should.eql(-2);
					error.syscall.should.eql('unlink');
					error.path.should.eql(dir);
				} catch (e) {
					return finished(e);
				}
				finished();
			});
		});

		// TODO: Try to delete a file/dir that we don't have permissions on
	});

	describe('#unlinkSync()', () => {
		it('is a function', () => {
			should(fs.unlinkSync).be.a.Function();
		});

		it.windowsDesktopBroken('deletes a file', () => {
			const filename = path.join(Ti.Filesystem.tempDirectory, `unlinkSync${Date.now()}.txt`);
			fs.writeFileSync(filename, 'Hello World!'); // windows desktop fails here
			// file should now exist
			should(fs.existsSync(filename)).eql(true);
			// delete it
			fs.unlinkSync(filename);
			// no longer should exist
			should(fs.existsSync(filename)).eql(false);
		});

		it.windowsDesktopBroken('throws trying to delete a directory', () => {
			const dir = Ti.Filesystem.tempDirectory;
			// dir should exist
			should(fs.existsSync(dir)).eql(true); // windows desktop fails here
			// try to delete it
			try {
				fs.unlinkSync(dir);
				should.fail(true, false, 'expected fs.unlinkSync to throw Error when deleting an existing directory\'s path');
			} catch (error) {
				should.exist(error);
				error.name.should.eql('Error');
				error.message.should.eql(`EISDIR: illegal operation on a directory, unlink '${dir}'`);
				error.code.should.eql('EISDIR');
				error.errno.should.eql(-21);
				error.syscall.should.eql('unlink');
				error.path.should.eql(dir);
			}
			// should still exist
			should(fs.existsSync(Ti.Filesystem.tempDirectory)).eql(true);
		});

		it('throws trying to delete a non-existent path', () => {
			const dir = '/made/up/path';
			// dir should not exist
			should(fs.existsSync(dir)).eql(false);
			// try to delete it
			try {
				fs.unlinkSync(dir);
				should.fail(true, false, 'expected fs.unlinkSync to throw Error when deleting a non-existent path');
			} catch (error) {
				should.exist(error);
				error.name.should.eql('Error');
				error.message.should.eql(`ENOENT: no such file or directory, unlink '${dir}'`);
				error.code.should.eql('ENOENT');
				error.errno.should.eql(-2);
				error.syscall.should.eql('unlink');
				error.path.should.eql(dir);
			}
		});

		// TODO: Try to delete a file/dir that we don't have permissions on
	});

	describe('#write()', () => {
		it('is a function', () => {
			should(fs.write).be.a.Function();
		});

		it.windowsDesktopBroken('writes a string to a file descriptor', finish => {
			const filename = path.join(Ti.Filesystem.tempDirectory, `writeString${Date.now()}.txt`);
			// ensure parent dir exists
			should(fs.existsSync(Ti.Filesystem.tempDirectory)).eql(true); // windows desktop fails here
			const fd = fs.openSync(filename, 'w');
			const contents = 'Hello write with a string!';
			fs.write(fd, contents, (err, bytes, string) => {
				try {
					should.not.exist(err);
					// file should now exist
					should(fs.existsSync(filename)).eql(true);
					// contents should match what we wrote
					should(fs.readFileSync(filename, 'utf-8')).eql(contents);
					string.should.eql(contents); // callback should get the contents we wrote
				} catch (e) {
					return finish(e);
				} finally {
					fs.closeSync(fd);
				}
				finish();
			});
		});

		it.windowsDesktopBroken('writes a Buffer to a file descriptor', finish => {
			const filename = path.join(Ti.Filesystem.tempDirectory, `writeBuffer${Date.now()}.txt`);
			// ensure parent dir exists
			should(fs.existsSync(Ti.Filesystem.tempDirectory)).eql(true); // windows desktop fails here
			const fd = fs.openSync(filename, 'w');
			const buffer = Buffer.from('Hello write with a Buffer!');
			fs.write(fd, buffer, (err, bytes, bufferFromCallback) => {
				try {
					should.not.exist(err);
					// file should now exist
					should(fs.existsSync(filename)).eql(true);
					bufferFromCallback.should.eql(buffer); // callback should get the contents we wrote
				} catch (e) {
					return finish(e);
				} finally {
					fs.closeSync(fd);
				}
				finish();
			});
		});

		// TODO: Test with range of a Buffer!
	});

	describe('#writeSync()', () => {
		it('is a function', () => {
			should(fs.writeSync).be.a.Function();
		});

		it.windowsDesktopBroken('writes a string to a file descriptor', () => {
			const filename = path.join(Ti.Filesystem.tempDirectory, `writeSyncString${Date.now()}.txt`);
			// ensure parent dir exists
			should(fs.existsSync(Ti.Filesystem.tempDirectory)).eql(true); // fails on Windows store/desktop here, returns false
			const fd = fs.openSync(filename, 'w');
			const contents = 'Hello write with a string!';
			try {
				const bytesWritten = fs.writeSync(fd, contents);
				bytesWritten.should.be.above(0);
				// file should now exist
				should(fs.existsSync(filename)).eql(true);
				// contents should match what we wrote
				should(fs.readFileSync(filename, 'utf-8')).eql(contents);
			} finally {
				fs.closeSync(fd);
			}
		});

		it.windowsDesktopBroken('writes a Buffer to a file descriptor', () => {
			const filename = path.join(Ti.Filesystem.tempDirectory, `writeSyncBuffer${Date.now()}.txt`);
			// ensure parent dir exists
			should(fs.existsSync(Ti.Filesystem.tempDirectory)).eql(true); // fails on Windows store/desktop here, returns false
			const fd = fs.openSync(filename, 'w');
			const buffer = Buffer.from('Hello write with a Buffer!');
			try {
				const bytesWritten = fs.writeSync(fd, buffer);
				bytesWritten.should.be.above(0);
				// file should now exist
				should(fs.existsSync(filename)).eql(true);
				// contents should match what we wrote
				// should(fs.readFileSync(filename)).eql(buffer); // FIXME: Calling eql with FastBuffer vs SlowBuffer fails right now
				should(fs.readFileSync(filename).equals(buffer)).be.true();
			} finally {
				fs.closeSync(fd);
			}
		});

		// TODO: Test with range of a Buffer!
	});

	describe('#writeFile()', () => {
		it('is a function', () => {
			should(fs.writeFile).be.a.Function();
		});

		it.windowsDesktopBroken('writes a string to a non-existent file', finish => {
			const filename = path.join(Ti.Filesystem.tempDirectory, `writeFile${Date.now()}.txt`);
			// ensure parent dir exists
			should(fs.existsSync(Ti.Filesystem.tempDirectory)).eql(true); // fails on Windows store/desktop here, returns false
			// ensure file does not
			should(fs.existsSync(filename)).eql(false);
			const contents = 'Hello World!';
			fs.writeFile(filename, contents, err => {
				try {
					should.not.exist(err);
					// file should now exist
					should(fs.existsSync(filename)).eql(true);
					// contents should match what we wrote
					should(fs.readFileSync(filename, 'utf-8')).eql(contents);
				} catch (e) {
					return finish(e);
				}
				finish();
			});
		});

		it.windowsDesktopBroken('writes a string to existing file, replaces it', finish => {
			const filename = path.join(Ti.Filesystem.tempDirectory, `writeFile${Date.now()}.txt`);
			// ensure parent dir exists
			should(fs.existsSync(Ti.Filesystem.tempDirectory)).eql(true); // fails on Windows store/desktop here, returns false
			// ensure file does not
			should(fs.existsSync(filename)).eql(false);
			const contents = 'Hello World!';
			fs.writeFile(filename, contents, err => {
				try {
					should.not.exist(err);

					// file should now exist
					should(fs.existsSync(filename)).eql(true); // FIXME: fails on Android
					// contents should match what we wrote
					should(fs.readFileSync(filename, 'utf-8')).eql(contents);

					// Now replace it's contents by writing again
					const contents2 = 'I replaced you!';
					fs.writeFile(filename, contents2, err2 => {
						try {
							should.not.exist(err2);
							// contents should match what we wrote
							should(fs.readFileSync(filename, 'utf-8')).eql(contents2);
						} catch (e) {
							return finish(e);
						}
						finish();
					});
				} catch (e) {
					return finish(e);
				}
			});
		});

		it.windowsDesktopBroken('throws if trying to write to path of an existing directory', finish => {
			const dirname = path.join(Ti.Filesystem.tempDirectory, `writeFile_d_${Date.now()}`);
			fs.mkdirSync(dirname); // fails on Windows store/desktop here
			// ensure dir exists
			should(fs.existsSync(dirname)).eql(true);

			fs.writeFile(dirname, 'Hello World!', error => {
				try {
					should.exist(error);
					// verify error
					error.should.have.properties({
						name: 'Error',
						message: `EISDIR: illegal operation on a directory, open '${dirname}'`,
						errno: -21,
						syscall: 'open',
						code: 'EISDIR',
						path: dirname
					});
				} catch (e) {
					return finish(e);
				}
				finish();
			});
		});

		// TODO: What if parent dir does not exist?
		// TODO: what if target path exists but is a directory?
		// TODO: What if data is a Buffer?
	});

	describe('#writeFileSync()', () => {
		it('is a function', () => {
			should(fs.writeFileSync).be.a.Function();
		});

		it.windowsDesktopBroken('writes a string to a non-existent file', () => {
			const filename = path.join(Ti.Filesystem.tempDirectory, `writeFileSync${Date.now()}.txt`);
			// ensure parent dir exists
			should(fs.existsSync(Ti.Filesystem.tempDirectory)).eql(true);
			// ensure file does not
			should(fs.existsSync(filename)).eql(false);
			const contents = 'Hello World!';
			fs.writeFileSync(filename, contents);
			// file should now exist
			should(fs.existsSync(filename)).eql(true);
			// contents should match what we wrote
			should(fs.readFileSync(filename, 'utf-8')).eql(contents);
		});

		it.windowsDesktopBroken('writes undefined to file if no data value passed', () => {
			const filename = path.join(Ti.Filesystem.tempDirectory, `writeFileSync_undefined_${Date.now()}.txt`);
			// ensure parent dir exists
			should(fs.existsSync(Ti.Filesystem.tempDirectory)).eql(true); // fails on Windows store/desktop here, returns false
			// ensure file does not
			should(fs.existsSync(filename)).eql(false);
			fs.writeFileSync(filename);
			// file should now exist
			should(fs.existsSync(filename)).eql(true);
			// contents should match literal 'undefined'
			should(fs.readFileSync(filename, 'utf-8')).eql('undefined');
		});

		it.windowsDesktopBroken('writes a string to existing file, replaces it', () => {
			const filename = path.join(Ti.Filesystem.tempDirectory, `writeFileSync${Date.now()}.txt`);
			// ensure parent dir exists
			should(fs.existsSync(Ti.Filesystem.tempDirectory)).eql(true); // fails on Windows store/desktop here, returns false
			// ensure file does not
			should(fs.existsSync(filename)).eql(false);
			const contents = 'Hello World!';
			fs.writeFileSync(filename, contents);
			// file should now exist
			should(fs.existsSync(filename)).eql(true); // FIXME: fails on Android
			// contents should match what we wrote
			should(fs.readFileSync(filename, 'utf-8')).eql(contents);

			// Now replace it's contents by writing again
			const contents2 = 'I replaced you!';
			fs.writeFileSync(filename, contents2);
			// contents should match what we wrote
			should(fs.readFileSync(filename, 'utf-8')).eql(contents2);
		});

		it.windowsDesktopBroken('throws if trying to write to path of an existing directory', () => {
			const dirname = path.join(Ti.Filesystem.tempDirectory, `writeFileSync_d_${Date.now()}`);
			fs.mkdirSync(dirname); // fails on Windows store/desktop here
			// ensure dir exists
			should(fs.existsSync(dirname)).eql(true);

			try {
				fs.writeFileSync(dirname, 'Hello World!');
				should.fail(true, false, 'expected fs.writeFileSync to throw Error when writing to existing directory\'s path');
			} catch (error) {
				// verify error
				error.should.have.properties({
					name: 'Error',
					message: `EISDIR: illegal operation on a directory, open '${dirname}'`,
					errno: -21,
					syscall: 'open',
					code: 'EISDIR',
					path: dirname
				});
			}
		});

		// TODO: What if parent dir does not exist?
		// TODO: what if target path exists but is a directory?
		// TODO: What if data is a Buffer?
	});

	// No-op stubs //////////////////////////
	// TODO: Verify the async ones call the callback!

	describe('#chmod()', () => {
		it('is a function', () => {
			should(fs.chmod).be.a.Function();
		});
	});

	describe('#chmodSync()', () => {
		it('is a function', () => {
			should(fs.chmodSync).be.a.Function();
		});
	});

	describe('#chown()', () => {
		it('is a function', () => should(fs.chown).be.a.Function());
	});

	describe('#chownSync()', () => {
		it.allBroken('is a function', () => should(fs.chownSync).be.a.Function());
	});

	describe('#fdatasync()', () => {
		it('is a function', () => {
			should(fs.fdatasync).be.a.Function();
		});
	});

	describe('#fdatasyncSync()', () => {
		it('is a function', () => {
			should(fs.fdatasyncSync).be.a.Function();
		});
	});

	describe('#unwatchFile()', () => {
		it('is a function', () => {
			should(fs.unwatchFile).be.a.Function();
		});
	});

	describe('#watchFile()', () => {
		it('is a function', () => {
			should(fs.watchFile).be.a.Function();
		});
	});
});
