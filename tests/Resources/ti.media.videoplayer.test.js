/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_ANDROID, OS_IOS */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

const should = require('./utilities/assertions');

describe('Titanium.Media', () => {
	it('#createVideoPlayer()', () => {
		should(Ti.Media.createVideoPlayer).be.a.Function();
	});
});

describe.androidARM64Broken('Titanium.Media.VideoPlayer', () => {
	let player;
	let win;

	beforeEach(() => {
		player = Ti.Media.createVideoPlayer();
	});

	afterEach(done => { // fires after every test in sub-suites too...
		player = null;
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

	describe('properties', () => {
		describe.ios('.allowsAirPlay', () => {
			it('is a Boolean', () => {
				should(player).have.a.property('allowsAirPlay').which.is.a.Boolean();
			});
		});

		describe('.apiName', () => {
			it('is a String', () => {
				should(player).have.a.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.Media.VideoPlayer', () => {
				should(player.apiName).eql('Ti.Media.VideoPlayer');
			});
		});

		describe('.autoplay', () => {
			it('is a Boolean', () => {
				should(player).have.a.property('autoplay').which.is.a.Boolean();
			});

			it('defaults to true', () => {
				should(player.autoplay).be.true();
			});
		});

		// describe.ios('.backgroundView', () => {
		// 	it('is an Object', () => {
		// 		// TODO: test instance of Titanium.UI.View
		// 		should(player).have.a.property('backgroundView').which.is.an.Object();
		// 	});
		// });

		describe('.currentPlaybackTime', () => {
			it('is a Number', () => {
				should(player).have.a.property('currentPlaybackTime').which.is.a.Number();
			});
		});

		describe('.duration', () => {
			it('is a Number', () => {
				// FIXME More specific check below is broken on Android
				should(player).have.readOnlyProperty('duration').which.is.a.Number();
				// should(player).have.a.property('duration').which.is.a.Number();
			});

			it('defaults to 0', () => {
				should(player.duration).eql(0);
			});
		});

		describe('.endPlaybackTime', () => {
			it('is a Number', () => {
				should(player).have.a.property('endPlaybackTime').which.is.a.Number();
			});

			it('defaults to 0', () => {
				should(player.endPlaybackTime).eql(0);
			});
		});

		describe.android('.fullscreen', () => {
			it('is a Boolean', () => { // eslint-disable-line mocha/no-identical-title
				should(player).have.a.property('fullscreen').which.is.a.Boolean();
			});

			it('defaults to false', () => {
				should(player.fullscreen).be.false();
			});
		});

		describe('.initialPlaybackTime', () => {
			it('is a Number', () => {
				should(player).have.a.property('initialPlaybackTime').which.is.a.Number();
			});
		});

		describe('.loadState', () => {
			it('is a Number', () => {
				should(player).have.a.readOnlyProperty('loadState').which.is.a.Number();
			});
		});

		// TODO: .media is write-only, add test that writes value here
		// describe.ios('.media', () => {
		// 	it('is a String', () => {
		// 		should(player).have.a.property('media').which.is.a.String();
		// 	});
		// });

		describe.ios('.mediaTypes', () => {
			it('is a String', () => {
				should(player).have.a.readOnlyProperty('mediaTypes').which.is.a.String();
			});

			it('is one of Ti.Media.VIDEO_MEDIA_TYPE_*', () => {
				should([
					Ti.Media.VIDEO_MEDIA_TYPE_AUDIO,
					Ti.Media.VIDEO_MEDIA_TYPE_CLOSED_CAPTION,
					Ti.Media.VIDEO_MEDIA_TYPE_DEPTH_DATA,
					Ti.Media.VIDEO_MEDIA_TYPE_METADATA,
					Ti.Media.VIDEO_MEDIA_TYPE_METADATA_OBJECT,
					Ti.Media.VIDEO_MEDIA_TYPE_MUXED,
					Ti.Media.VIDEO_MEDIA_TYPE_SUBTITLE,
					Ti.Media.VIDEO_MEDIA_TYPE_TEXT,
					Ti.Media.VIDEO_MEDIA_TYPE_TIMECODE,
					Ti.Media.VIDEO_MEDIA_TYPE_VIDEO,
				]).containEql(player.mediaTypes);
			});
		});

		describe.ios('.moviePlayerStatus', () => {
			it('is a Number', () => { // eslint-disable-line mocha/no-identical-title
				should(player).have.a.readOnlyProperty('moviePlayerStatus').which.is.a.Number();
			});

			it('is one of Ti.Media.VIDEO_LOAD_STATE_*', () => {
				should([
					Ti.Media.VIDEO_LOAD_STATE_FAILED,
					Ti.Media.VIDEO_LOAD_STATE_PLAYABLE,
					Ti.Media.VIDEO_LOAD_STATE_UNKNOWN,
				]).containEql(player.moviePlayerStatus);
			});
		});

		describe.ios('.naturalSize', () => {
			it('is an Object having width and height', () => {
				should(player).have.a.property('naturalSize').which.is.an.Object();
				// TODO: Check defaults to 0?
				should(player.naturalSize).have.a.property('width').which.is.a.Number();
				should(player.naturalSize).have.a.property('height').which.is.a.Number();
			});
		});

		// FIXME: I don't think we can get the value of overlayView property!
		// describe.ios('.overlayView', () => {
		// 	it('is an Object', () => { // eslint-disable-line mocha/no-identical-title
		// 		// TODO: Test for Ti.UI.View instance!
		// 		should(player).have.a.property('overlayView').which.is.an.Object();
		// 	});
		// });

		describe.ios('.pictureInPictureEnabled', () => {
			it('is a Boolean', () => { // eslint-disable-line mocha/no-identical-title
				should(player).have.a.property('pictureInPictureEnabled').which.is.a.Boolean();
			});

			it('defaults to false', () => { // eslint-disable-line mocha/no-identical-title
				should(player.pictureInPictureEnabled).be.true();
			});
		});

		describe('.playableDuration', () => {
			it('is a Number', () => {
				// FIXME doesn't work on Android, because we don't have a way to denote read-only property attributes easily in Java kroll annotations
				should(player).have.readOnlyProperty('playableDuration').which.is.a.Number();
				// should(player).have.a.property('playableDuration').which.is.a.Number();
			});

			it('defaults to 0', () => {
				should(player.playableDuration).eql(0);
			});

			it.ios('in milliseconds', function (finish) {
				this.timeout(10000);

				player = Ti.Media.createVideoPlayer({
					url: 'https://raw.githubusercontent.com/appcelerator/titanium_mobile/master/tests/remote/mov_bbb.mp4',
					autoplay: true,
					showsControls: false,
					height: 200
				});

				win = Ti.UI.createWindow();
				function durationavailable(e) {
					player.removeEventListener('durationavailable', durationavailable);
					try {
						e.duration.should.be.above(1000);
						player.duration.should.be.above(1000);
						player.playableDuration.should.be.above(1000);
					} catch (err) {
						return finish(err);
					}
					finish();
				}
				player.addEventListener('durationavailable', durationavailable);

				win.add(player);
				win.open();
			});
		});

		describe('.playbackState', () => {
			it('is a Number', () => {
				should(player).have.a.readOnlyProperty('playbackState').which.is.a.Number();
			});

			it('is one of Ti.Media.VIDEO_PLAYBACK_STATE_*', () => {
				const values = [
					Ti.Media.VIDEO_PLAYBACK_STATE_INTERRUPTED,
					Ti.Media.VIDEO_PLAYBACK_STATE_PAUSED,
					Ti.Media.VIDEO_PLAYBACK_STATE_PLAYING,
					Ti.Media.VIDEO_PLAYBACK_STATE_STOPPED,
				];
				if (OS_ANDROID) {
					values.push(Ti.Media.VIDEO_PLAYBACK_STATE_SEEKING_BACKWARD);
					values.push(Ti.Media.VIDEO_PLAYBACK_STATE_SEEKING_FORWARD);
				}
				should(values).containEql(player.playbackState);
			});
		});

		describe('.playing', () => {
			it('is a Boolean', () => {
				should(player).have.a.readOnlyProperty('playing').which.is.a.Boolean();
			});
		});

		describe('.repeatMode', () => {
			it('is a Number', () => {
				should(player).have.a.property('repeatMode').which.is.a.Number();
			});

			it('defaults to Titanium.Media.VIDEO_REPEAT_MODE_NONE', () => {
				should(player.repeatMode).eql(Titanium.Media.VIDEO_REPEAT_MODE_NONE);
			});

			it('is one of Ti.Media.VIDEO_REPEAT_MODE_*', () => {
				should([
					Ti.Media.VIDEO_REPEAT_MODE_NONE,
					Ti.Media.VIDEO_REPEAT_MODE_ONE,
				]).containEql(player.repeatMode);
			});
		});

		describe('.scalingMode', () => {
			it('is a Number', () => {
				if (OS_IOS) { // FIXME: Parity issue!
					should(player).have.a.property('scalingMode').which.is.a.String();
				} else {
					should(player).have.a.property('scalingMode').which.is.a.Number();
				}
			});

			it('defaults to Ti.Media.VIDEO_SCALING_RESIZE_ASPECT on Android, Ti.Media.VIDEO_SCALING_RESIZE on iOS', () => {
				if (OS_ANDROID) {
					should(player.scalingMode).eql(Ti.Media.VIDEO_SCALING_RESIZE_ASPECT);
				} else {
					should(player.scalingMode).eql(Ti.Media.VIDEO_SCALING_RESIZE);
				}
			});

			it('is one of Ti.Media.VIDEO_SCALING_*', () => {
				const values = [
					Ti.Media.VIDEO_SCALING_RESIZE,
					Ti.Media.VIDEO_SCALING_RESIZE_ASPECT,
					Ti.Media.VIDEO_SCALING_RESIZE_ASPECT_FILL,
				];
				if (OS_ANDROID) {
					values.push(Ti.Media.VIDEO_SCALING_NONE);
					values.push(Ti.Media.VIDEO_SCALING_ASPECT_FILL);
					values.push(Ti.Media.VIDEO_SCALING_ASPECT_FIT);
					values.push(Ti.Media.VIDEO_SCALING_MODE_FILL);
				}
				should(values).containEql(player.scalingMode);
			});
		});

		describe('.showsControls', () => {
			it('is a Boolean', () => {
				should(player).have.a.property('showsControls').which.is.a.Boolean();
			});

			it('defaults to true', () => {
				should(player.showsControls).be.true();
			});
		});

		describe('.url', () => {
			// it('is a String', () => {
			// 	should(player).have.a.property('url').which.is.a.String();
			// });

			it('defaults to undefined', () => {
				should(player.url).be.undefined();
			});
		});

		describe.ios('.volume', () => {
			it('is a Number', () => { // eslint-disable-line mocha/no-identical-title
				should(player).have.a.property('volume').which.is.a.Number();
			});

			it('defaults to 1', () => {
				should(player.volume).eql(1);
			});
		});
	});

	describe('methods', () => {
		describe('#cancelAllThumbnailImageRequests', () => {
			it('is a Function', () => {
				should(player.cancelAllThumbnailImageRequests).be.a.Function();
			});
		});

		describe('#pause', () => {
			it('is a Function', () => {
				should(player.pause).be.a.Function();
			});
		});

		describe('#play', () => {
			it('is a Function', () => {
				should(player.play).be.a.Function();
			});
		});

		describe('#release', () => {
			it('is a Function', () => {
				should(player.release).be.a.Function();
			});
		});

		describe('#requestThumbnailImagesAtTimes', () => {
			it('is a Function', () => {
				should(player.requestThumbnailImagesAtTimes).be.a.Function();
			});
		});

		describe('#stop', () => {
			it('is a Function', () => {
				should(player.stop).be.a.Function();
			});
		});
	});

	it('Close window containing a video player (TIMOB-25574)', function (finish) {
		this.timeout(15000);

		const window = Ti.UI.createWindow({
			backgroundColor: 'white'
		});
		const nav = Ti.UI.createNavigationWindow({ window });
		window.addEventListener('focus', openWindow);

		nav.open();

		function openWindow() {
			window.removeEventListener('focus', openWindow);
			const detailWindow = Ti.UI.createWindow({
				backgroundColor: 'black'
			});

			player = Ti.Media.createVideoPlayer({
				url: 'https://raw.githubusercontent.com/appcelerator/titanium_mobile/master/tests/remote/mov_bbb.mp4',
				autoplay: true,
				backgroundColor: 'blue',
				height: 300,
				width: 300,
				mediaControlStyle: Ti.Media.VIDEO_CONTROL_NONE,
				scalingMode: Ti.Media.VIDEO_SCALING_ASPECT_FILL, // Android-only
				repeatMode: Ti.Media.VIDEO_REPEAT_MODE_ONE,
				showsControls: false
			});

			detailWindow.addEventListener('open', () => {
				setTimeout(() => detailWindow.close(), 2000);
			});

			detailWindow.addEventListener('close', () => {
				setTimeout(() => {
					nav.close();
					finish(); // We are done!
				}, 2000);
			});

			detailWindow.add(player);
			nav.openWindow(detailWindow);
		}
	});

	it('Release video player and close window (TIMOB-26033)', function (finish) {
		this.timeout(10000);
		const videoWindow = Ti.UI.createWindow();
		player = Ti.Media.createVideoPlayer({
			url: 'https://raw.githubusercontent.com/appcelerator/titanium_mobile/master/tests/remote/mov_bbb.mp4',
			top: 2,
			autoplay: true,
			backgroundColor: 'blue',
			height: 300,
			width: 300,
			mediaControlStyle: Ti.Media.VIDEO_CONTROL_DEFAULT, // Android-only!
			scalingMode: Ti.Media.VIDEO_SCALING_ASPECT_FIT // Android-only!
		});

		win = Ti.UI.createWindow();
		win.addEventListener('open', () => {
			setTimeout(() => videoWindow.open(), 200);
		});

		videoWindow.addEventListener('open', function () {
			setTimeout(() => {
				player.release(); // release *before* removing and closing!
				videoWindow.remove(player);
				player = null;
				videoWindow.close();
			}, 2000);
		});

		videoWindow.addEventListener('close', () => finish());

		videoWindow.add(player);
		win.open();
	});

	it.ios('App should not crash when setting video player url to null (TIMOB-27799)', function (finish) {
		this.timeout(10000);

		win = Ti.UI.createWindow();
		player = Ti.Media.createVideoPlayer({
			height: '72%',
			url: '/movie.mp4'
		});
		win.add(player);
		win.addEventListener('open', () => {
			player.play();

			setTimeout(() => {
				player.stop();
				player.url = null;
			}, 2000);
		});

		player.addEventListener('playing', () => finish());
		win.open();
	});

	it.ios('App should not crash when setting url after video player creation (TIMOB-28217)', function (finish) {
		this.timeout(10000);

		win = Ti.UI.createWindow();
		player = Ti.Media.createVideoPlayer({
			top: 120,
			autoplay: false,
			backgroundColor: 'blue',
			height: 300,
			width: 300,
			mediaControlStyle: Titanium.Media.VIDEO_CONTROL_DEFAULT,
			scalingMode: Titanium.Media.VIDEO_SCALING_ASPECT_FIT,
			showsControls: true,
		});
		player.url = '/movie.mp4';
		win.add(player);
		win.addEventListener('open', () => {
			finish();
		});

		win.open();
	});
});
