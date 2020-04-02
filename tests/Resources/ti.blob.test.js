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

describe('Titanium.Blob', function () {
	let win;

	afterEach(function (done) {
		if (win) {
			// If `win` is already closed, we're done.
			const t = setTimeout(function () {
				if (win) {
					win = null;
					done();
				}
			}, 3000);

			win.addEventListener('close', function listener () {
				clearTimeout(t);

				if (win) {
					win.removeEventListener('close', listener);
				}
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it('.apiName', () => {
		// FIXME Should be able to do Ti.Blob.apiName
		const blob = Ti.Filesystem.getFile('app.js').read();
		should(blob).have.a.readOnlyProperty('apiName').which.is.a.String;
		should(blob.apiName).be.eql('Ti.Blob');
	});

	it('constructed from File.read()', () => {
		const blob = Ti.Filesystem.getFile('app.js').read();
		should(blob).be.an.Object;
		// should(blob).be.an.instanceof(Ti.Blob); // Crashes Windows, throws uncaught error on iOS & Android
	});

	// Windows crashes on instanceof check TIMOB-25012
	// Windows also crashes if we uncomment this now, I think closing the window (or failing the test) in the blob callback is causing Desktop crash
	// Android is sometimes timing out... Trying an open event now...
	// TODO: Test is tempermental, skipping for now...
	it.skip('constructed from image', function (finish) { // eslint-disable-line mocha/no-skipped-tests
		var label;
		win = Ti.UI.createWindow();
		label = Ti.UI.createLabel({ text: 'test' });
		win.add(label);
		win.addEventListener('open', function () {
			label.toImage(function (blob) {
				should(blob).be.an.Object;
				// should(blob).be.an.instanceof(Ti.Blob); // FIXME Crashes Windows, throws uncaught error on iOS & Android
				// should(blob.getText()).equal(null); // FIXME 'blob.getText is not a function' on iOS
				// should(blob.text).equal(null); // FIXME this is undefined on iOS, docs say it should be null
				should(blob.text).not.exist;

				should(blob.width).be.a.Number; // FIXME Undefined on iOS
				should(blob.width).be.above(0); // 0 on Windows

				should(blob.height).be.a.Number;
				should(blob.height).be.above(0);

				should(blob.length).be.a.Number;

				should(blob.size).be.a.Number;
				should(blob.size).equal(blob.width * blob.height);

				finish();
			});
		});
		win.open();
	});

	it('.text', () => {
		const blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.text).be.a.String;
		should(blob.text.length).be.above(0);
		should(blob.text).equal(blob.toString());
		// TODO Test that it's read-only
	});

	describe('#append()', function () {
		it('is a Function', () => {
			const blob = Ti.Filesystem.getFile('app.js').read();
			should(blob.append).be.a.Function;
		});

		it('appends two files together', () => {
			const appJsBlob = Ti.Filesystem.getFile('app.js').read();
			// FIXME Use __filename? That returns '/ti.blob.test.js' on iOS, which getFile doesn't handle correctly
			const thisFile = Ti.Filesystem.getFile('ti.blob.test.js').read();
			const originalLength = appJsBlob.length;
			const originalText = appJsBlob.text;
			const thisFileText = thisFile.text;
			const thisFileLength = thisFile.length;
			appJsBlob.append(thisFile);
			// Now the blob's text should be the concatentaion of the two blobs
			appJsBlob.text.should.be.eql(originalText + thisFileText);
			// and the size should be their sum
			appJsBlob.length.should.be.eql(originalLength + thisFileLength);
			// The passed in blob shouldn't be changed
			thisFile.length.should.eql(thisFileLength);
			thisFile.text.should.eql(thisFileText);
		});
	});

	it('.nativePath', () => {
		const blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.nativePath).be.a.String;
		should(blob.nativePath.length).be.above(0);
		// TODO Test that it's read-only
	});

	describe('.mimeType', function () {
		it.windowsDesktopBroken('javascript file', () => {
			const blob = Ti.Filesystem.getFile('app.js').read();
			should(blob.mimeType).be.a.String;
			should(blob.mimeType.length).be.above(0); // Windows desktop returns 0 here
			// Android is reporting 'application/javascript' now on Android 29+
			// iOS/older Android report 'text/javascript'
			[ 'text/javascript', 'application/javascript' ].should.containEql(blob.mimeType);
		});

		it('image/png', () => {
			const blob = Ti.Filesystem.getFile('Logo.png').read();
			should(blob.mimeType).be.a.String;
			should(blob.mimeType.length).be.above(0);
			should(blob.mimeType).be.eql('image/png');
			// TODO Test that it's read-only
		});
	});

	it('.length', () => {
		const blob = Ti.Filesystem.getFile('app.js').read();
		should(blob.length).be.a.Number;
		should(blob.length).be.above(0);
		// TODO Test that it's read-only
	});

	// Parity issue, add to Android API
	describe('.size', function () {
		it('returns byte count of non-image (JS file)', () => {
			const blob = Ti.Filesystem.getFile('app.js').read();
			should(blob.size).be.a.Number;
			should(blob.size).be.above(0);
			should(blob.size).be.eql(blob.length); // size and length should be the same for non-images
			// TODO Test that it's read-only
		});

		// FIXME Returns 801 on Windows
		it.windowsBroken('returns pixel count for image (PNG)', () => {
			const blob = Ti.Filesystem.getFile('Logo.png').read();
			should(blob.size).be.a.Number;
			should(blob.size).equal(blob.width * blob.height);
			// TODO Test that it's read-only
		});
	});

	describe('.width', function () {
		it('returns pixel count for PNG', () => {
			const blob = Ti.Filesystem.getFile('Logo.png').read();
			should(blob.width).be.a.Number;
			should(blob.width).be.eql(150);
			// TODO Test that it's read-only
		});

		it('returns 0 for non-image (JS file)', function () {
			var blob = Ti.Filesystem.getFile('app.js').read();
			should(blob.width).be.a.Number;
			should(blob.width).be.eql(0);
			// TODO Test that it's read-only
		});
	});

	describe('.height', function () {
		it('returns pixel count for PNG', () => {
			const blob = Ti.Filesystem.getFile('Logo.png').read();
			should(blob.height).be.a.Number;
			should(blob.height).be.eql(150);
			// TODO Test that it's read-only
		});

		it('returns 0 for non-image (JS file)', () => {
			const blob = Ti.Filesystem.getFile('app.js').read();
			should(blob.height).be.a.Number;
			should(blob.height).be.eql(0);
			// TODO Test that it's read-only
		});
	});

	it('.file', function () {
		var blob = Ti.Filesystem.getFile('app.js').read();
		var file = blob.file;
		should(file.toString()).be.a.String;
		should(file.nativePath).be.eql(blob.nativePath);
		// TODO Test that it's read-only
	});

	// TODO Test file property is null for non-file backed Blobs!

	describe.windowsMissing('#imageAsCompressed()', function () {
		it('is a Function', function () {
			var blob = Ti.Filesystem.getFile('Logo.png').read();
			should(blob.imageAsCompressed).be.a.Function;
		});

		it('with PNG', function () {
			var blob = Ti.Filesystem.getFile('Logo.png').read();
			var b = blob.imageAsCompressed(0.5);
			should(b).be.an.Object;
			// width and height should remain the same
			should(b.width).be.eql(blob.width);
			should(b.height).be.eql(blob.height);
			// Ideally, the byte size should drop - though that's not guranteed!
			// should(b.length).be.below(blob.length);
			// becomes a JPEG, so I guess we could test mimeType?
			should(b.mimeType).be.eql('image/jpeg');
		});

		it('with non-image (JS file) returns null', function () {
			var blob = Ti.Filesystem.getFile('app.js').read();
			var b = blob.imageAsCompressed(0.5);
			should(b).not.exist;
		});
	});

	describe('#imageAsCropped()', function () {
		it('is a Function', function () {
			var blob = Ti.Filesystem.getFile('Logo.png').read();
			should(blob.imageAsCropped).be.a.Function;
		});

		it('with PNG', function () {
			var blob = Ti.Filesystem.getFile('Logo.png').read();
			var b = blob.imageAsCropped({ width: 50, height: 60, x: 0, y: 0 });
			should(b).be.an.Object;
			should(b.width).be.eql(50);
			should(b.height).be.eql(60);
		});

		it('with non-image (JS file) returns null', function () {
			var blob = Ti.Filesystem.getFile('app.js').read();
			var b = blob.imageAsCropped({ width: 50, height: 60, x: 0, y: 0 });
			should(b).not.exist;
		});
	});

	describe('#imageAsResized()', function () {
		it('is a Function', function () {
			var blob = Ti.Filesystem.getFile('Logo.png').read();
			should(blob.imageAsResized).be.a.Function;
		});

		it('with PNG', function () {
			var blob = Ti.Filesystem.getFile('Logo.png').read();
			var b = blob.imageAsResized(50, 60);
			should(b).be.an.Object;
			should(b.width).be.eql(50);
			should(b.height).be.eql(60);
		});

		it('with non-image (JS file) returns null', function () {
			var blob = Ti.Filesystem.getFile('app.js').read();
			var b = blob.imageAsResized(50, 60);
			should(b).not.exist;
		});
	});

	describe('#imageAsThumbnail()', function () {
		it('is a Function', function () {
			var blob = Ti.Filesystem.getFile('Logo.png').read();
			should(blob.imageAsThumbnail).be.a.Function;
		});

		it.windowsBroken('with PNG generates an image with desired size plus a default 1px border around that', function () {
			var blob = Ti.Filesystem.getFile('Logo.png').read();
			var thumbnailSize = 50;
			var b = blob.imageAsThumbnail(thumbnailSize);
			var borderSize = 1; // defaults to a border of 1 when unspecified
			should(b).be.an.Object;
			// iOS and Android apply border around the image, so full size is thumbnailSize + 2*border
			should(b.width).be.eql(thumbnailSize + (2 * borderSize));
			should(b.height).be.eql(thumbnailSize + (2 * borderSize));
		});

		it('with non-image (JS file) returns null', function () {
			var blob = Ti.Filesystem.getFile('app.js').read();
			var b = blob.imageAsThumbnail(50);
			should(b).not.exist;
		});
	});

	describe('#imageWithAlpha()', function () {
		it('is a Function', function () {
			var blob = Ti.Filesystem.getFile('Logo.png').read();
			should(blob.imageWithAlpha).be.a.Function;
		});

		it.windowsBroken('with PNG', function () {
			var blob = Ti.Filesystem.getFile('Logo.png').read();
			var b = blob.imageWithAlpha();
			// just adds an alpha channel. Not sure how this is useful!
			should(b).be.an.Object;
			should(b.width).be.eql(blob.width);
			should(b.height).be.eql(blob.height);
		});

		it('with non-image (JS file) returns null', function () {
			var blob = Ti.Filesystem.getFile('app.js').read();
			var b = blob.imageWithAlpha();
			should(b).not.exist;
		});
	});

	describe('#imageWithRoundedCorner()', () => {
		it('is a Function', () => {
			const blob = Ti.Filesystem.getFile('Logo.png').read();
			should(blob.imageWithRoundedCorner).be.a.Function;
		});

		it.windowsBroken('with PNG generates rounded corner image with an additional default border of 1', function () {
			const blob = Ti.Filesystem.getFile('Logo.png').read();
			const cornerSize = 4;
			const borderSize = 1; // defaults to 1 when unspecified
			const b = blob.imageWithRoundedCorner(cornerSize);
			should(b).be.an.Object;
			should(b.width).be.eql(blob.width + (2 * borderSize));
			should(b.height).be.eql(blob.height + (2 * borderSize));
		});

		it('with non-image (JS file) returns null', () => {
			const blob = Ti.Filesystem.getFile('app.js').read();
			const b = blob.imageWithRoundedCorner(1);
			should(b).not.exist;
		});
	});

	describe('#imageWithTransparentBorder()', () => {
		it('is a Function', () => {
			const blob = Ti.Filesystem.getFile('Logo.png').read();
			should(blob.imageWithTransparentBorder).be.a.Function;
		});

		it.windowsBroken('with PNG adds border around original image', () => {
			const blob = Ti.Filesystem.getFile('Logo.png').read();
			const borderSize = 5;
			const b = blob.imageWithTransparentBorder(borderSize);
			should(b).be.an.Object;
			should(b.width).be.eql(blob.width + (2 * borderSize)); // border on each side
			should(b.height).be.eql(blob.height + (2 * borderSize)); // border on top+bottom
		});

		it('with non-image (JS file) returns null', () => {
			const blob = Ti.Filesystem.getFile('app.js').read();
			const b = blob.imageWithTransparentBorder(1);
			should(b).not.exist;
		});
	});

	describe('#toString()', () => {
		it('is a Function', () => {
			const blob = Ti.Filesystem.getFile('app.js').read();
			should(blob.toString).be.a.Function;
		});

		it('returns text value', () => {
			const blob = Ti.Filesystem.getFile('app.js').read();
			should(blob.toString()).eql(blob.text);
		});

		it('returns "[object TiBlob] for binary content', () => {
			const blob = Ti.Filesystem.getFile('SmallLogo.png').read();
			should(blob.toString()).eql('[object TiBlob]');
		});

		it('returns empty string for buffer with empty string', () => {
			const blob = Ti.createBuffer({ value: '' }).toBlob();
			should(blob.toString()).eql('');
		});

		it('returns ascii text content for buffer with ascii text content', () => {
			const blob = Ti.createBuffer({ value: 'test toString()' }).toBlob();
			should(blob.toString()).eql('test toString()');
		});
	});

	it('resize very large image', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'gray' });
		const img = Ti.UI.createImageView();

		// Obtain large image blob. (8000px, 8000px)
		let blob = Ti.Filesystem.getFile('large.jpg').read();
		should(blob).be.an.Object;

		win.addEventListener('open', () => {
			// Keep re-sizing the image down by 10%
			for (let i = 0; i < 10; i++) {

				// De-reference original blob so it can be freed.
				blob = blob.imageAsResized(blob.width / 1.1, blob.height / 1.1);
				should(blob).be.an.Object;
			}

			// Display re-sized image.
			img.image = blob;

			finish();
		});

		win.add(img);
		win.open();
	});
});
