/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const Timeout = require('./utilities/timeouts');
const utilities = require('./utilities/utilities');
const isAndroid = utilities.isAndroid();

describe('Titanium.UI.ImageView', function () {
	this.timeout(Timeout.DEFAULT);

	let win;
	afterEach(done => { // fires after every test in sub-suites too...
		if (win && !win.closed) {
			win.addEventListener('close', function listener () {
				win.removeEventListener('close', listener);
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
		const imageView = Ti.UI.createImageView();
		should(imageView).have.readOnlyProperty('apiName').which.is.a.String();
		should(imageView.apiName).be.eql('Ti.UI.ImageView');
	});

	describe('.image', () => {
		it('has no accessors', () => {
			const imageView = Ti.UI.createImageView({});
			should(imageView).not.have.accessors('image');
		});

		it('with an URL', () => {
			const imageView = Ti.UI.createImageView({
				image: 'https://www.google.com/images/srpr/logo11w.png'
			});
			should(imageView.image).be.a.String();
			should(imageView.image).eql('https://www.google.com/images/srpr/logo11w.png');
			imageView.image = 'path/to/logo.png';
			should(imageView.image).eql('path/to/logo.png');
		});

		// The ImageView must be added to an open window so the native view is
		// realized; otherwise the "image" property change is never applied and
		// the "load" event never fires.
		it('with a local file path', finish => {
			win = Ti.UI.createWindow();
			const imageView = Ti.UI.createImageView();
			imageView.addEventListener('load', function () {
				try {
					should(imageView.image).be.a.String();
					should(imageView.image).eql(Ti.Filesystem.resourcesDirectory + 'Logo.png');
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.add(imageView);
			imageView.image = Ti.Filesystem.resourcesDirectory + 'Logo.png';
			win.open();
		});

		it('with a local path with separator', finish => {
			win = Ti.UI.createWindow();
			const imageView = Ti.UI.createImageView();
			imageView.addEventListener('load', function () {
				try {
					should(imageView.image).be.a.String();
					should(imageView.image).eql(Ti.Filesystem.resourcesDirectory + Ti.Filesystem.separator + 'Logo.png');
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			// Try appending separator
			// It's not quite clear if we need separator, but people often do this
			win.add(imageView);
			imageView.image = Ti.Filesystem.resourcesDirectory + Ti.Filesystem.separator + 'Logo.png';
			win.open();
		});

		it('with local path with /', finish => {
			win = Ti.UI.createWindow();
			const imageView = Ti.UI.createImageView();
			imageView.addEventListener('load', function () {
				try {
					should(imageView.image).be.a.String();
					should(imageView.image).eql(Ti.Filesystem.resourcesDirectory + '/Logo.png');
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			// Try appending '/' for the separator
			// Technically this is not right on Windows, but people often do this
			win.add(imageView);
			imageView.image = Ti.Filesystem.resourcesDirectory + '/Logo.png';
			win.open();
		});

		it('with Ti.Filesystem.File.nativePath value', finish => {
			const fromFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png');
			win = Ti.UI.createWindow();
			const imageView = Ti.UI.createImageView();
			imageView.addEventListener('load', function () {
				try {
					should(imageView.image).be.a.String();
					should(imageView.image).eql(fromFile.nativePath);
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.add(imageView);
			imageView.image = fromFile.nativePath;
			win.open();
		});

		it.windows('with ms-appx:// URL', finish => {
			const imageView = Ti.UI.createImageView();
			imageView.addEventListener('load', function () {
				try {
					should(imageView.image).be.a.String();
					should(imageView.image).eql('ms-appx:///Logo.png');
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			imageView.image = 'ms-appx:///Logo.png';
		});

		it.windows('with ms-appdata:// URL', finish => {
			const fromFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png');
			const toFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory + 'TIMOB-20609.png');
			toFile.write(fromFile.read());

			const imageView = Ti.UI.createImageView();
			imageView.addEventListener('load', function () {
				try {
					should(imageView.image).be.a.String();
					should(imageView.image).eql('ms-appdata:///local/TIMOB-20609.png');
				} catch (err) {
					return finish(err);
				} finally {
					toFile.deleteFile();
				}
				finish();
			});

			imageView.image = 'ms-appdata:///local/TIMOB-20609.png';
		});

		// Windows: TIMOB-24985
		it('with Ti.Fielsystem.File', finish => {
			const fromFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png');

			win = Ti.UI.createWindow();
			const imageView = Ti.UI.createImageView();
			imageView.addEventListener('load', function () {
				try {
					should(imageView.image).be.an.Object();
					should(imageView.image).eql(fromFile);
				} catch (err) {
					return finish(err);
				}
				finish();
			});

			win.add(imageView);
			imageView.image = fromFile;
			win.open();
		});

		function doBlobTest(testName, blob, finish) {
			win = Ti.UI.createWindow();
			const imageView = Ti.UI.createImageView({ image: blob });
			imageView.addEventListener('postlayout', function listener(e) {
				try {
					imageView.removeEventListener(e.type, listener);
					should(imageView.size.width > 0).be.true();
					if (isAndroid) {
						should(imageView).matchImage('snapshots/' + testName + '.png');
					}
					finish();
				} catch (err) {
					finish(err);
				}
			});
			win.add(imageView);
			win.open();
		}

		it('with Ti.Blob PNG', function (finish) {
			const blob = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png').read();
			setTimeout(function () {
				doBlobTest('png', blob, finish);
			}, 100);
		});

		it('with Ti.Blob WebP', function (finish) {
			const blob = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.webp').read();
			setTimeout(function () {
				doBlobTest('webp', blob, finish);
			}, 100);
		});

		it.windowsBroken('with redirected URL and autorotate set to true', function (finish) {
			this.slow(8000);
			this.timeout(Timeout.DEFAULT);

			win = Ti.UI.createWindow();
			const imageView = Ti.UI.createImageView({
				image: 'http://raw.githubusercontent.com/recurser/exif-orientation-examples/master/Portrait_3.jpg',
				autorotate: true
			});
			imageView.addEventListener('load', () => finish());
			win.add(imageView);
			win.open();
		});

		// On Android, paths are relative to JS file.
		// On iOS and Windows, paths are relative to app's "Resources" directory.
		// The below works on all platforms because this JS file is in the "Resources" directory.
		it('with root-relative path', function (finish) {
			this.slow(8000);
			this.timeout(Timeout.DEFAULT);

			win = Ti.UI.createWindow();
			const imageView = Ti.UI.createImageView({
				autorotate: true
			});
			imageView.addEventListener('load', () => finish());
			win.add(imageView);
			imageView.image = 'Logo.png';
			win.open();
		});

		it('with image from folder', function (finish) {
			this.timeout(Timeout.DEFAULT);

			let loadCount = 0;
			win = Ti.UI.createWindow();
			const imageView = Ti.UI.createImageView({
				image: 'Logo.png'
			});
			imageView.addEventListener('load', function () {
				loadCount++;
				if (loadCount > 1) {
					finish();
				} else {
					imageView.image = '/image folder/Logo.png';
				}
			});
			win.add(imageView);
			win.open();
		});

		it('fires error event for URL pointing at resource that does not exist', function (finish) {
			// Default timeout for iOS is 20 seconds.
			this.timeout(Timeout.LONG);

			win = Ti.UI.createWindow();
			const img = Ti.UI.createImageView({});
			img.addEventListener('error', () => finish());
			img.image = 'https://invalid.host.com/image.jpg';
			win.add(img);
			win.open();
		});
	});

	describe.android('.imageTouchFeedback', () => {
		function test(imageViewProperties, finish) {
			win = Ti.UI.createWindow();
			win.add(Ti.UI.createImageView(imageViewProperties));
			win.addEventListener('postlayout', function listener() {
				win.removeEventListener('postlayout', listener);
				finish();
			});
			win.open();
		}

		it('without image', function (finish) {
			test({ imageTouchFeedback: true }, finish);
		});

		it('with image', function (finish) {
			test({ image: 'Logo.png', imageTouchFeedback: true }, finish);
		});

		it('with imageTouchFeedbackColor', function (finish) {
			test({ image: 'Logo.png', imageTouchFeedback: true, imageTouchFeedbackColor: 'yellow' }, finish);
		});

		it('with WebP res file', function (finish) {
			win = Ti.UI.createWindow();
			const imageView = Ti.UI.createImageView({ image: '/images/logo.webp' });
			imageView.addEventListener('postlayout', function listener(e) {
				try {
					imageView.removeEventListener(e.type, listener);
					should(imageView).matchImage('snapshots/webp_res.png');
					finish();
				} catch (err) {
					finish(err);
				}
			});
			win.add(imageView);
			win.open();
		});
	});

	// TODO: Combine all tests for 'images' property into one suite
	// TODO Make this test cross-platform. We're using ms-appx urls here
	it.windows('images', function (finish) {
		var imageView,
			error;
		this.timeout(Timeout.DEFAULT);

		win = Ti.UI.createWindow();
		imageView = Ti.UI.createImageView({
			width: Ti.UI.FILL, height: Ti.UI.FILL
		});
		imageView.addEventListener('start', function () {
			try {
				should(imageView.animating).be.true();
			} catch (err) {
				error = err;
			}

			finish(error);
		});
		imageView.addEventListener('load', function () {
			try {
				should(imageView.animating).be.false();
			} catch (err) {
				error = err;
			}
			imageView.start();
		});
		win.addEventListener('open', function () {
			imageView.images = [
				'ms-appx:///Logo.png',
				'ms-appx:///Logo.png',
				'ms-appx:///Logo.png'
			];
		});
		win.add(imageView);
		win.open();
	});

	it('images (File)', function (finish) {
		var imageView,
			error;
		this.timeout(Timeout.DEFAULT);

		win = Ti.UI.createWindow();
		imageView = Ti.UI.createImageView({
			width: Ti.UI.FILL, height: Ti.UI.FILL
		});
		imageView.addEventListener('start', function () {
			try {
				should(imageView.animating).be.true();
			} catch (err) {
				error = err;
			}

			finish(error);
		});
		imageView.addEventListener('load', function () {
			try {
				should(imageView.animating).be.false();
				imageView.start();
			} catch (err) {
				error = err;
			}
		});
		win.addEventListener('open', function () {
			var fromFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png');
			imageView.images = [ fromFile, fromFile, fromFile ];
		});

		win.add(imageView);
		win.open();
	});

	// iOS Can't read the image from the Blob. Fix how we grab the blob on iOS?
	// Android crashes for me locally. We should load blobs from multiple files, not the same one multiple times
	it('images (Blob)', function (finish) {
		var imageView,
			error;
		this.timeout(Timeout.DEFAULT);

		win = Ti.UI.createWindow();
		imageView = Ti.UI.createImageView({
			width: Ti.UI.FILL, height: Ti.UI.FILL
		});

		imageView.addEventListener('start', function () {
			try {
				should(imageView.animating).be.true();
			} catch (err) {
				error = err;
			}

			finish(error);
		});
		imageView.addEventListener('load', function () {
			try {
				should(imageView.animating).be.false();
			} catch (err) {
				error = err;
			}
			imageView.start();
		});
		win.addEventListener('open', function () {
			var fromFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png');
			imageView.images = [ fromFile.read(), fromFile.read(), fromFile.read() ];
		});

		win.add(imageView);
		win.open();
	});

	describe('.scalingMode', () => {
		function test(scalingMode, finish) {
			win = Ti.UI.createWindow();
			const imageView = Ti.UI.createImageView({
				image: '/Logo.png',
				scalingMode: scalingMode,
				autosize: true,
				width: Ti.UI.FILL,
				height: Ti.UI.FILL
			});
			win.add(imageView);
			win.addEventListener('postlayout', function listener() {
				try {
					win.removeEventListener('postlayout', listener);
					should(imageView.scalingMode).be.eql(scalingMode);
				} catch (err) {
					finish(err);
				}
				finish();
			});
			win.open();
		}

		it('IMAGE_SCALING_NONE', function (finish) {
			test(Ti.Media.IMAGE_SCALING_NONE, finish);
		});

		it('IMAGE_SCALING_FILL', function (finish) {
			test(Ti.Media.IMAGE_SCALING_FILL, finish);
		});

		it('IMAGE_SCALING_ASPECT_FILL', function (finish) {
			test(Ti.Media.IMAGE_SCALING_ASPECT_FILL, finish);
		});

		it('IMAGE_SCALING_ASPECT_FIT', function (finish) {
			test(Ti.Media.IMAGE_SCALING_ASPECT_FIT, finish);
		});
	});

	// TIMOB-18684
	// Use a local square image (Logo.png is 150x150) so the test doesn't
	// depend on a remote URL. With width:100 and height:SIZE the image
	// scales to height:100, which the assertions verify.
	it('layoutWithSIZE_and_fixed', function (finish) {
		var view,
			innerView;
		this.slow(1000);
		this.timeout(Timeout.DEFAULT);

		win = Ti.UI.createWindow();

		view = Ti.UI.createView({
			backgroundColor: 'green',
			width: 100,
			height: Ti.UI.SIZE
		});
		innerView = Ti.UI.createImageView({
			image: '/Logo.png',
			width: 100,
			height: Ti.UI.SIZE,
			top: 0,
			left: 0
		});
		view.add(innerView);
		view.addEventListener('postlayout', function () {
			try {
				should(innerView.size.height).eql(100);
				should(view.size.height).eql(innerView.size.height);
				should(view.size.width).eql(innerView.size.width);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.add(view);
		win.open();
	});

	it('should handle file URLs from applicationDataDirectory - TIMOB-18262', function (finish) {
		const imageView = Ti.UI.createImageView({
			top: 10
		});
		const icon = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png');
		const dest = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'Logo.png');

		should(icon.exists()).be.true();
		dest.write(icon.read());
		should(dest.exists()).be.true();

		imageView.addEventListener('error', function () {
			finish('Failed to load PNG file from applicationDataDirectory');
		});

		imageView.addEventListener('load', function (e) {
			try {
				should(e.state).eql('images'); // Windows doesn't set this property!
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'white'
		});

		win.add(imageView);
		win.open();

		imageView.images = [ Ti.Filesystem.applicationDataDirectory  + 'Logo.png' ];
	});

	it('should handle absolute-looking paths by resolving relative to resource dir', function (finish) {
		const imageView = Ti.UI.createImageView({
			top: 10
		});

		imageView.addEventListener('error', function () {
			finish('Failed to load PNG file from absolute path that is really relative to resources');
		});

		imageView.addEventListener('load', function (e) {
			try {
				should(e.state).eql('images'); // Windows doesn't set this property!
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		win = Ti.UI.createWindow({
			backgroundColor: 'white'
		});

		win.add(imageView);
		win.open();

		imageView.images = [ '/Logo.png' ];
	});
});
