/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

const isIOS = utilities.isIOS();

describe('Titanium.Filesystem.File', () => {
	it.android('handles URIs with no scheme', () => {
		// If we use file: URIs without file://, it messes up the ability to copy/move files without fix for TIMOB-27191
		// This is important because the node shim for 'path' will generate file: style URIs when joining tempDir on Android with other relative paths
		const src = Ti.Filesystem.getFile(`file:${Ti.Filesystem.tempDirectory.substring(7)}/renameSync${Date.now()}`);
		should(src.createFile()).eql(true);
		const dest = `file:${Ti.Filesystem.tempDirectory.substring(7)}/renameSync-renamed-${Date.now()}`;
		src.move(dest);

		const destFile = Ti.Filesystem.getFile(dest);

		should(src.exists()).eql(false); // returns true
		should(destFile.exists()).eql(true);
	});

	describe('constructed via URIs', () => {
		let noSchemeTempAppJS;
		let fileURI;
		before(() => {
			const appJSURI = isIOS ? 'app.js' : 'app://app.js'; // iOS doesn't support app: uris!
			const appJS = Ti.Filesystem.getFile(appJSURI);

			// Generate a file:// URI for the temp dir. Android reports one as-is, iOS reports an sbolute filepath so we pre-pend file:// to it
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
			should(file.exists()).equal(true); // FIXME: Fails on Android, but only if run as part of full suite!
		});

		it.androidAndIosBroken('file:// relative path', () => {
			// FIXME: Android seems to basically forcibly place '/' in front of paths not beginning with '..' or '/'
			// FIXME: iOS does not seem to try and resolve relative paths for file:// URIs
			const file = Ti.Filesystem.getFile('file://app.js'); // app.js should be relative to this file...
			should.exist(file);
			should(file.exists()).equal(true);
		});

		it.androidAndIosBroken('file: relative path', () => {
			// FIXME: iOS does not seem to support file: URIs without file:// (see FilesystemModule.m, line 38)
			// FIXME: Android ends up calling startsWith on a null String reference (likely TiFileProxy.java, line 73)
			const file = Ti.Filesystem.getFile('file:app.js');
			should.exist(file);
			should(file.exists()).equal(true);
		});

		it.iosBroken('file: absolute path', () => {
			// FIXME: iOS does not seem to support file: URIs without file:// (see FilesystemModule.m, line 38)
			const file = Ti.Filesystem.getFile(`file:${noSchemeTempAppJS}`);
			should.exist(file);
			should(file.exists()).equal(true); // FIXME: Fails on Android, but only if run as part of full suite!
		});

		it.androidBroken('no scheme - absolute path', () => {
			// FIXME: Failing! Likely because getFile() assumes appdata-private scheme if none given!
			// Whereas my fix was in TiFileFactory, used internally by webview, database, file.move(), file.copy()
			const file = Ti.Filesystem.getFile(noSchemeTempAppJS);
			should.exist(file);
			should(file.exists()).equal(true);
		});

		it('no scheme - relative path', () => {
			const file = Ti.Filesystem.getFile('app.js');
			should.exist(file);
			should(file.exists()).equal(true);
		});

		// TODO: appdata-private:// (which getFile assumes if no scheme!)
		it.android('appdata-private://', () => {
			// becomes a TitaniumBlob so exists()/read() don't work on it!
			// How can we check it "worked"?
			const file = Ti.Filesystem.getFile('appdata-private://appdata-private.js');
			should.exist(file);
			should(file.exists()).equal(true);
		});

		it.android('content://', () => {
			// becomes a TitaniumBlob so exists()/read() don't work on it!
			// How can we check it "worked"?
			const file = Ti.Filesystem.getFile(`content://${Ti.App.id}.tifileprovider/assets/Resources/app.js`);
			should.exist(file);
		});

		it.iosBroken('app:// - absolute path', () => {
			// FIXME: iOS doesn't support app: URIs in getFile!
			const file = Ti.Filesystem.getFile('app:///app.js');
			should.exist(file);
			should(file.exists()).equal(true);
		});

		it.iosBroken('app:// - relative path', () => {
			// FIXME: iOS doesn't support app: URIs in getFile!
			const file = Ti.Filesystem.getFile('app://app.js');
			should.exist(file);
			should(file.exists()).equal(true);
		});

		it.android('android.resource://', () => {
			// becomes a TitaniumBlob so exists()/read() don't work on it!
			// How can we check it "worked"?
			const file = Ti.Filesystem.getFile(`android.resource://${Ti.App.id}/drawable/appicon`);
			should.exist(file);
		});

		it.android('file:///android_asset absolute path', () => {
			const file = Ti.Filesystem.getFile('file:///android_asset/Resources/app.js');
			should.exist(file);
			should(file.exists()).equal(true);
		});
	});
});
