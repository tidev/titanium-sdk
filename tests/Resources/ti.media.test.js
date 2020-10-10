/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_IOS */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Media', function () {

	it('apiName', function () {
		var media = Ti.Media;
		should(media).have.readOnlyProperty('apiName').which.is.a.String();
		should(media.apiName).be.eql('Ti.Media');
	});

	// constants
	it.windowsMissing('AUDIO_STATE_BUFFERING', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_BUFFERING').which.is.a.Number();
	});

	it.windowsMissing('AUDIO_STATE_INITIALIZED', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_INITIALIZED').which.is.a.Number();
	});

	it.windowsMissing('AUDIO_STATE_PAUSED', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_PAUSED').which.is.a.Number();
	});

	it.windowsMissing('AUDIO_STATE_PLAYING', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_PLAYING').which.is.a.Number();
	});

	it.windowsMissing('AUDIO_STATE_STARTING', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_STARTING').which.is.a.Number();
	});

	it.windowsMissing('AUDIO_STATE_STOPPED', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_STOPPED').which.is.a.Number();
	});

	it.windowsMissing('AUDIO_STATE_STOPPING', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_STOPPING').which.is.a.Number();
	});

	it.windowsMissing('AUDIO_STATE_WAITING_FOR_DATA', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_WAITING_FOR_DATA').which.is.a.Number();
	});

	it.windowsMissing('AUDIO_STATE_WAITING_FOR_QUEUE', function () {
		should(Ti.Media).have.constant('AUDIO_STATE_WAITING_FOR_QUEUE').which.is.a.Number();
	});

	// video recording quality constants tests
	it('Video recording quality 640x480', function () {
		should(Ti.Media.QUALITY_640x480).not.be.undefined();
	});

	it('Video recording quality HIGH', function () {
		should(Ti.Media.QUALITY_HIGH).not.be.undefined();
	});

	it('Video recording quality IFRAME_1280x720', function () {
		should(Ti.Media.QUALITY_IFRAME_1280x720).not.be.undefined();
	});

	it.ios('Video recording quality QUALITY_IFRAME_960x540', function () {
		should(Ti.Media.QUALITY_IFRAME_960x540).not.be.undefined();
	});

	it('Video recording quality LOW', function () {
		should(Ti.Media.QUALITY_LOW).not.be.undefined();
	});

	it.ios('Video recording quality MEDIUM', function () {
		should(Ti.Media.QUALITY_MEDIUM).not.be.undefined();
	});

	it('hasAudioRecorderPermissions()', function () {
		should(Ti.Media.hasAudioRecorderPermissions).be.a.Function();
		should(Ti.Media.hasAudioRecorderPermissions()).be.a.Boolean();
	});

	it('hasCameraPermissions()', function () {
		should(Ti.Media.hasCameraPermissions).be.a.Function();
		should(Ti.Media.hasCameraPermissions()).be.a.Boolean();
	});

	it.ios('hasMusicLibraryPermissions()', function () {
		should(Ti.Media.hasMusicLibraryPermissions).be.a.Function();
		should(Ti.Media.hasMusicLibraryPermissions()).be.a.Boolean();
	});

	it('hasPhotoGalleryPermissions()', function () {
		should(Ti.Media.hasPhotoGalleryPermissions).be.a.Function();
		should(Ti.Media.hasPhotoGalleryPermissions()).be.a.Boolean();
	});

	it('requestAudioRecorderPermissions()', function () {
		should(Ti.Media.requestAudioRecorderPermissions).be.a.Function();
	});

	it('requestCameraPermissions()', function () {
		should(Ti.Media.requestCameraPermissions).be.a.Function();
	});

	it.ios('requestMusicLibraryPermissions()', function () {
		should(Ti.Media.requestMusicLibraryPermissions).be.a.Function();
	});

	it('requestPhotoGalleryPermissions()', function () {
		should(Ti.Media.requestPhotoGalleryPermissions).be.a.Function();
	});

	it.windowsMissing('takeScreenshot', function (finish) {
		should(Ti.Media.takeScreenshot).not.be.undefined();
		should(Ti.Media.takeScreenshot).be.a.Function();

		// take a screenshot
		Ti.Media.takeScreenshot(function (image) {
			if (image && image.media) {
				finish();
			} else {
				finish(new Error('failed to obtain screenshot'));
			}
		});
	});

	it.android('previewImage', function () {
		should(Ti.Media.previewImage).not.be.undefined();
		should(Ti.Media.previewImage).be.a.Function();
	});

	// FIXME: java.lang.ClassCastException: byte[] cannot be cast to org.appcelerator.titanium.io.TiBaseFile
	// This assumes the TiBlob is from a file, but in this case it's not.
	// MediaModule.java needs to be updated to write to a temp file in this case,
	// like we do for EmailDialogProxy
	// it.android('preview image from screenshot', function (finish) {
	it.allBroken('preview image from screenshot', function (finish) {
		// take a screenshot
		Ti.Media.takeScreenshot(function (image) {
			if (image && image.media) {
				Ti.Media.previewImage({
					success: function () {
						finish();
					},
					error: function (e) {
						finish(e);
					},
					image: image
				});
			} else {
				finish(new Error('failed to obtain screenshot'));
			}
		});
	});

	// FIXME: Fails to write to file on CI machine
	// Presumably it's because we need to ask for storage permissions, which we can't do in a headless way
	// it.android('preview image read/write external storage', function (finish) {
	it.allBroken('preview image read/write external storage', function (finish) {
		// take a screenshot
		Ti.Media.takeScreenshot(function (image) {
			var tmp;
			if (image && image.media) {
				tmp = Ti.Filesystem.getFile(Ti.Filesystem.externalStorageDirectory, 'temp.png');

				// write to external storage
				tmp.write(image.media);

				// preview image from external storage
				Ti.Media.previewImage({
					success: function () {
						finish();
					},
					error: function (e) {
						finish(e);
					},
					image: tmp.read()
				});
			} else {
				finish(new Error('failed to obtain screenshot'));
			}
		});
	});

	it('openPhotoGallery', function () {
		should(Ti.Media.openPhotoGallery).not.be.undefined();
		should(Ti.Media.openPhotoGallery).be.a.Function();
	});

	describe('saveToPhotoGallery', function () {
		it('blob', function (finish) {
			if (!Ti.Media.hasPhotoGalleryPermissions()) {
				return finish();
			}
			const blob = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png').read();
			Ti.Media.saveToPhotoGallery(blob, {
				success: () => { finish(); },
				error: (e) => { finish(new Error(e.message)); }
			});
		});

		it('file - resourcesDirectory', function (finish) {
			if (!Ti.Media.hasPhotoGalleryPermissions()) {
				return finish();
			}
			const file = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png');
			Ti.Media.saveToPhotoGallery(file, {
				success: () => { finish(); },
				error: (e) => { finish(new Error(e.message)); }
			});
		});

		it('file - applicationDataDirectory', function (finish) {
			if (!Ti.Media.hasPhotoGalleryPermissions()) {
				return finish();
			}
			const internalFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, 'Logo.png');
			const externalFile = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'SaveToPhotoGallery.png');
			if (externalFile.exists()) {
				externalFile.deleteFile();
			}
			internalFile.copy(externalFile.nativePath);
			Ti.Media.saveToPhotoGallery(externalFile, {
				success: () => { finish(); },
				error: (e) => { finish(new Error(e.message)); }
			});
		});
	});
});
