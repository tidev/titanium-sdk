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

describe('Titanium.Blob', function () {
	var win;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it('apiName', function () {
		// FIXME Should be able to do Ti.Blob.apiName
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob).have.a.readOnlyProperty('apiName').which.is.a.String;
		should(blob.apiName).be.eql('Ti.Blob');
	});

	it('constructed from File.read()', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob).be.an.Object;
		// should(blob).be.an.instanceof(Ti.Blob); // Crashes Windows, throws uncaught error on iOS & Android
	});

	// Windows crashes on instanceof check TIMOB-25012
	// Windows also crashes if we uncomment this now, I think closing the window (or failing the test) in the blob callback is causing Desktop crash
	// Android is sometimes timing out... Trying an open event now...
	// TODO: Test is tempermental, skipping for now...
	it.skip('constructed from image', function (finish) {
		var label;
		win = Ti.UI.createWindow();
		label = Ti.UI.createLabel({ text: 'test' });
		win.add(label);
		win.addEventListener('open', function () {
			label.toImage(function (e) {
				should(e.blob).be.an.Object;
				// should(blob).be.an.instanceof(Ti.Blob); // FIXME Crashes Windows, throws uncaught error on iOS & Android
				// should(blob.getText()).equal(null); // FIXME 'blob.getText is not a function' on iOS
				// should(blob.text).equal(null); // FIXME this is undefined on iOS, docs say it should be null
				should(e.blob.text).not.exist;
				Ti.API.info(e.blob.width);
				should(e.blob.width).be.a.Number; // FIXME Undefined on iOS
				should(e.blob.width).be.above(0); // 0 on Windows
				should(e.blob.height).be.a.Number;
				should(e.blob.height).be.above(0);
				should(e.blob.length).be.a.Number;
				// FIXME Parity issue, no size property on Android
				if (!utilities.isAndroid()) {
					should(e.blob.size).be.a.Number;
					should(e.blob.size).equal(e.blob.width * blob.height);
				}
				finish();
			});
		});
		win.open();
	});

	it('text', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.text).be.a.String;
		should(blob.text.length).be.above(0);
		should(blob.text).equal(blob.toString());
		// TODO Test that it's read-only
	});

	// FIXME Add to iOS API
	it.iosMissing('append', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.append).be.a.Function;
		// TODO Test actually appending data to it
	});

	it('nativePath', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.nativePath).be.a.String;
		should(blob.nativePath.length).be.above(0);
		// TODO Test that it's read-only
	});

	it.windowsDesktopBroken('mimeType with text/javascript', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.mimeType).be.a.String;
		should(blob.mimeType.length).be.above(0); // Windows desktop returns 0 here
		should(blob.mimeType).be.eql('text/javascript');
		// TODO Test that it's read-only
	});

	it('mimeType with image/png', function () {
		var blob = Ti.Filesystem.getFile('Logo.png').read();
		should(blob.mimeType).be.a.String;
		should(blob.mimeType.length).be.above(0);
		should(blob.mimeType).be.eql('image/png');
		// TODO Test that it's read-only
	});

	it('length', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.length).be.a.Number;
		should(blob.length).be.above(0);
		// TODO Test that it's read-only
	});

	// Parity issue, add to Android API
	it.androidMissing('size in bytes', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.size).be.a.Number;
		should(blob.size).be.above(0);
		// TODO Test that it's read-only
	});

	// FIXME Missing API on Android, parity issue
	// FIXME Returns 801 on Windows
	it.androidMissingAndWindowsBroken('size in pixels', function () {
		var blob = Ti.Filesystem.getFile('Logo.png').read();
		should(blob.size).be.a.Number;
		should(blob.size).be.eql(22500);
		// TODO Test that it's read-only
	});

	// FIXME Get working for iOS - I think app thinning is getting rid of Logo.png
	it.iosBroken('width', function () {
		var blob = Ti.Filesystem.getFile('Logo.png').read();
		should(blob.width).be.a.Number;
		should(blob.width).be.eql(150);
		// TODO Test that it's read-only
	});

	// FIXME Get working for iOS - I think app thinning is getting rid of Logo.png
	it.iosBroken('height', function () {
		var blob = Ti.Filesystem.getFile('Logo.png').read();
		should(blob.height).be.a.Number;
		should(blob.height).be.eql(150);
		// TODO Test that it's read-only
	});

	it('width of non-image', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.width).be.a.Number;
		should(blob.width).be.eql(0);
		// TODO Test that it's read-only
	});

	it('height of non-image', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.height).be.a.Number;
		should(blob.height).be.eql(0);
		// TODO Test that it's read-only
	});

	it('file', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		var file = blob.file;
		should(file.toString()).be.a.String;
		should(file.nativePath).be.eql(blob.nativePath);
		// TODO Test that it's read-only
	});

	// TODO Test file property is null for non-file backed Blobs!

	// FIXME Get working for iOS - I think app thinning is getting rid of Logo.png
	it.iosBroken('imageAsCropped', function () {
		var blob = Ti.Filesystem.getFile('Logo.png').read();
		should(blob.imageAsCropped).be.a.Function;
		should(function () {
			var b = blob.imageAsCropped({ width: 50, height: 60, x: 0, y: 0 });
			should(b).be.an.Object;
			should(b.width).be.eql(50);
			should(b.height).be.eql(60);
		}).not.throw();
	});

	// FIXME Get working for iOS - I think app thinning is getting rid of Logo.png
	it.iosBroken('imageAsResized', function () {
		var blob = Ti.Filesystem.getFile('Logo.png').read();
		should(blob.imageAsResized).be.a.Function;
		should(function () {
			var b = blob.imageAsResized(50, 60);
			should(b).be.an.Object;
			should(b.width).be.eql(50);
			should(b.height).be.eql(60);
		}).not.throw();
	});

	// FIXME Get working for iOS - I think app thinning is getting rid of Logo.png
	it.iosBroken('imageAsThumbnail', function () {
		var blob = Ti.Filesystem.getFile('Logo.png').read();
		should(blob.imageAsThumbnail).be.a.Function;
		should(function () {
			var b = blob.imageAsThumbnail(50);
			should(b).be.an.Object;
			should(b.width).eql(50);
			should(b.height).eql(50);
		}).not.throw();
	});

	// FIXME Get working for iOS - I think app thinning is getting rid of Logo.png
	it.iosBroken('imageWithAlpha', function () {
		var blob = Ti.Filesystem.getFile('Logo.png').read();
		should(blob.imageWithAlpha).be.a.Function;
		should(function () {
			blob.imageWithAlpha();
		}).not.throw();
	});

	// FIXME Get working for iOS - I think app thinning is getting rid of Logo.png
	it.iosBroken('imageWithRoundedCorner', function () {
		var blob = Ti.Filesystem.getFile('Logo.png').read();
		should(blob.imageWithRoundedCorner).be.a.Function;
		should(function () {
			blob.imageWithRoundedCorner(1);
		}).not.throw();
	});

	// FIXME Get working for iOS - I think app thinning is getting rid of Logo.png
	it.iosBroken('imageWithTransparentBorder', function () {
		var blob = Ti.Filesystem.getFile('Logo.png').read();
		should(blob.imageWithTransparentBorder).be.a.Function;
		should(function () {
			blob.imageWithTransparentBorder(1);
		}).not.throw();
	});

	it('imageAsCropped of non-image', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.imageAsCropped).be.a.Function;
		should(function () {
			var b = blob.imageAsCropped({ width: 50, height: 60, x: 0, y: 0 });
			should(b).not.exist;
		}).not.throw();
	});

	it('imageAsResized of non-image', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.imageAsCropped).be.a.Function;
		should(function () {
			var b = blob.imageAsResized(50, 60);
			should(b).not.exist;
		}).not.throw();
	});

	it('imageAsThumbnail of non-image', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.imageAsCropped).be.a.Function;
		should(function () {
			var b = blob.imageAsThumbnail(50);
			should(b).not.exist;
		}).not.throw();
	});

	it('imageWithAlpha of non-image', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.imageAsCropped).be.a.Function;
		should(function () {
			var b = blob.imageWithAlpha();
			should(b).not.exist;
		}).not.throw();
	});

	it('imageWithRoundedCorner of non-image', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.imageAsCropped).be.a.Function;
		should(function () {
			var b = blob.imageWithRoundedCorner(1);
			should(b).not.exist;
		}).not.throw();
	});

	it('imageWithTransparentBorder of non-image', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.imageAsCropped).be.a.Function;
		should(function () {
			var b = blob.imageWithTransparentBorder(1);
			should(b).not.exist;
		}).not.throw();
	});
});
