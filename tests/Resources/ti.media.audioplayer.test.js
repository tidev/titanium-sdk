/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_ANDROID, OS_VERSION_MAJOR */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint no-undef: "off" */
/* eslint-disable mocha/no-identical-title */
'use strict';

const should = require('./utilities/assertions');

describe('Titanium.Media.AudioPlayer', () => {
	let audioPlayer;

	const errorLog = e => console.error(e.error);

	beforeEach(() => {
		audioPlayer = Ti.Media.createAudioPlayer({ url: '/sample.mp3' });
		audioPlayer.addEventListener('error', errorLog);
	});

	afterEach(() => {
		if (audioPlayer) {
			audioPlayer.removeEventListener('error', errorLog);
			if (OS_ANDROID) {
				audioPlayer.release();
			}
		}
		audioPlayer = null;
	});

	describe('properties', () => {
		// FIXME: Add test for this creation-only property
		// describe.android('.allowBackground', () => {
		// 	it('is a Boolean', () => {
		// 		should(audioPlayer).have.a.property('allowBackground').which.is.a.Boolean();
		// 	});

		// 	it('defaults to false', () => {
		// 		should(audioPlayer.allowBackground).be.false();
		// 	});
		// });

		describe.ios('.allowsExternalPlayback', () => {
			it('is a Boolean', () => {
				should(audioPlayer).have.a.property('allowsExternalPlayback').which.is.a.Boolean();
			});

			it('defaults to true', () => {
				should(audioPlayer.allowsExternalPlayback).be.true();
			});
		});

		describe('.apiName', () => {
			it('is a String', () => {
				should(audioPlayer).have.a.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.Media.AudioPlayer', () => {
				should(audioPlayer.apiName).eql('Ti.Media.AudioPlayer');
			});
		});

		// FIXME: Add test for this creation-only property
		// describe.android('.audioFocus', () => {
		// 	it('is a Boolean', () => {
		// 		should(audioPlayer).have.a.property('audioFocus').which.is.a.Boolean();
		// 	});

		// 	it('defaults to false', () => {
		// 		should(audioPlayer.audioFocus).be.false();
		// 	});
		// });

		describe.android('audioSessionId', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.property('audioSessionId').which.is.a.Number();
			});
		});

		describe.android('.audioType', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.property('audioType').which.is.a.Number();
			});

			it('defaults to Titanium.Media.AudioPlayer.AUDIO_TYPE_MEDIA', () => {
				should(audioPlayer.audioType).eql(Titanium.Media.AudioPlayer.AUDIO_TYPE_MEDIA);
			});

			it('is one of Ti.Media.Sound.AUDIO_TYPE_*', () => {
				should([
					Ti.Media.Sound.AUDIO_TYPE_ALARM,
					Ti.Media.Sound.AUDIO_TYPE_SIGNALLING,
					Ti.Media.Sound.AUDIO_TYPE_MEDIA,
					Ti.Media.Sound.AUDIO_TYPE_NOTIFICATION,
					Ti.Media.Sound.AUDIO_TYPE_RING,
					Ti.Media.Sound.AUDIO_TYPE_VOICE,
				]).containEql(audioPlayer.audioType);
			});
		});

		describe.ios('.bitRate', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.property('bitRate').which.is.a.Number();
			});
		});

		describe.ios('.bufferSize', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.property('bufferSize').which.is.a.Number();
			});
		});

		describe('.duration', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.readOnlyProperty('duration').which.is.a.Number();
			});

			// FIXME: This hangs on Android 5 and macOS! It's unclear why...
			it.windowsMissing('gives around 45 seconds for test input', function (finish) {
				// skip on older android since it intermittently hangs forever on android 5 emulator
				if (OS_ANDROID && OS_VERSION_MAJOR < 6) {
					return finish();
				}

				audioPlayer.start();
				setTimeout(function () {
					try {
						// give a tiny bit of fudge room here. iOS and Android differ by 5ms on this file
						should(audioPlayer.duration).be.within(45250, 45500); // 45 seconds. iOS gives us 45322, Android gives 45327
					} catch (e) {
						return finish(e);
					}
					finish();
				}, 1000);
			});
		});

		describe.ios('.externalPlaybackActive', () => {
			it('is a Boolean', () => {
				should(audioPlayer).have.a.readOnlyProperty('externalPlaybackActive').which.is.a.Boolean();
			});
		});

		describe.ios('.idle', () => {
			it('is a Boolean', () => {
				should(audioPlayer).have.a.readOnlyProperty('idle').which.is.a.Boolean();
			});
		});

		describe('.muted', () => {
			it('is a Boolean', () => {
				should(audioPlayer).have.a.property('muted').which.is.a.Boolean();
			});
		});

		describe('.paused', () => {
			it('is a Boolean', () => {
				should(audioPlayer).have.a.property('paused').which.is.a.Boolean();
			});

			it('does not have accessors', () => {
				should(audioPlayer).not.have.accessors('paused');
			});
		});

		describe('.playing', () => {
			it('is a Boolean', () => {
				should(audioPlayer).have.a.readOnlyProperty('playing').which.is.a.Boolean();
			});

			it('does not have accessors', () => {
				should(audioPlayer).not.have.accessors('playing');
			});
		});

		describe.ios('.progress', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.readOnlyProperty('progress').which.is.a.Number();
			});
		});

		describe.ios('.rate', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.property('rate').which.is.a.Number();
			});

			it('defaults to 0', () => {
				should(audioPlayer.rate).eql(0);
			});
		});

		describe.ios('.state', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.readOnlyProperty('state').which.is.a.Number();
			});

			it('is one of Ti.Media.AUDIO_STATE_*', () => {
				should([
					Ti.Media.AUDIO_STATE_BUFFERING,
					Ti.Media.AUDIO_STATE_INITIALIZED,
					Ti.Media.AUDIO_STATE_PAUSED,
					Ti.Media.AUDIO_STATE_PLAYING,
					Ti.Media.AUDIO_STATE_STARTING,
					Ti.Media.AUDIO_STATE_STOPPED,
					Ti.Media.AUDIO_STATE_STOPPING,
					Ti.Media.AUDIO_STATE_WAITING_FOR_DATA,
					Ti.Media.AUDIO_STATE_WAITING_FOR_QUEUE,
				]).containEql(audioPlayer.state);
			});
		});

		describe.android('.time', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.property('time').which.is.a.Number();
			});
		});

		describe('.url', () => {
			it('is a String', () => {
				should(audioPlayer).have.a.property('url').which.is.a.String();
			});

			it('does not have accessors', () => {
				should(audioPlayer).not.have.accessors('url');
			});

			it('re-setting does not crash (TIMOB-26334)', () => {
				// Re-set URL to test TIMOB-26334, this should not crash
				audioPlayer.url = '/sample.mp3';
			});
		});

		describe('.volume', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.property('volume').which.is.a.Number();
			});
		});

		describe.ios('.waiting', () => {
			it('is a Boolean', () => {
				should(audioPlayer).have.a.readOnlyProperty('waiting').which.is.a.Boolean();
			});
		});

	});

	describe('methods', () => {
		// FIXME: This should probably be a read-only property!
		describe.android('#getAudioSessionId', () => {
			it('is a Function', () => {
				should(audioPlayer.getAudioSessionId).be.a.Function();
			});
		});

		describe('#pause', () => {
			it('is a Function', () => {
				should(audioPlayer.pause).be.a.Function();
			});

			it('called delayed after #start()', function (finish) {
				// skip on older android since it intermittently hangs forever on android 5 emulator
				if (OS_ANDROID && OS_VERSION_MAJOR < 6) {
					return finish();
				}
				audioPlayer.start();

				setTimeout(function () {
					try {
						audioPlayer.pause();
					} catch (e) {
						return finish(e);
					}
					finish();
				}, 1000);
			});
		});

		describe.android('#play', () => {
			it('is a Function', () => {
				should(audioPlayer.play).be.a.Function();
			});
		});

		describe('#release', () => {
			it('is a Function', () => {
				should(audioPlayer.release).be.a.Function();
			});
		});

		describe('#restart', () => {
			it('is a Function', () => {
				should(audioPlayer.restart).be.a.Function();
			});

			it.windowsBroken('called delayed after #start()', function (finish) {
				audioPlayer.start();
				// I think if the media completes first, then restart may get us into a funky state? Or maybe just calling start() at any time after the on complete event fires?

				setTimeout(function () {
					try {
						audioPlayer.restart();
						audioPlayer.stop();
					} catch (e) {
						return finish(e);
					}
					finish();
				}, 1000);
			});
		});

		describe.ios('#seekToTime', () => {
			it('is a Function', () => {
				should(audioPlayer.seekToTime).be.a.Function();
			});
		});

		describe.ios('#setPaused', () => {
			it('is a Function', () => {
				should(audioPlayer.setPaused).be.a.Function();
			});
		});

		describe('#start', () => {
			it('is a Function', () => {
				should(audioPlayer.start).be.a.Function();
			});
		});

		describe.ios('#stateDescription', () => {
			it('is a Function', () => {
				should(audioPlayer.stateDescription).be.a.Function();
			});
		});

		describe('#stop', () => {
			it('is a Function', () => {
				should(audioPlayer.stop).be.a.Function();
			});

			it('called delayed after #start', function (finish) {
				audioPlayer.start();

				setTimeout(function () {
					try {
						audioPlayer.stop();
					} catch (e) {
						return finish(e);
					}
					finish();
				}, 1000);
			});
		});

	});

	describe('constants', () => {
		describe.android('.AUDIO_TYPE_ALARM', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('AUDIO_TYPE_ALARM').which.is.a.Number();
			});
		});

		describe.android('.AUDIO_TYPE_MEDIA', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('AUDIO_TYPE_MEDIA').which.is.a.Number();
			});
		});

		describe.android('.AUDIO_TYPE_NOTIFICATION', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('AUDIO_TYPE_NOTIFICATION').which.is.a.Number();
			});
		});

		describe.android('.AUDIO_TYPE_RING', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('AUDIO_TYPE_RING').which.is.a.Number();
			});
		});

		describe.android('.AUDIO_TYPE_SIGNALLING', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('AUDIO_TYPE_SIGNALLING').which.is.a.Number();
			});
		});

		describe.android('.AUDIO_TYPE_VOICE', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('AUDIO_TYPE_VOICE').which.is.a.Number();
			});
		});

		describe('.STATE_BUFFERING', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('STATE_BUFFERING').which.is.a.Number();
			});
		});

		describe('.STATE_INITIALIZED', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('STATE_INITIALIZED').which.is.a.Number();
			});
		});

		describe('.STATE_PAUSED', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('STATE_PAUSED').which.is.a.Number();
			});
		});

		describe('.STATE_PLAYING', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('STATE_PLAYING').which.is.a.Number();
			});
		});

		describe('.STATE_STARTING', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('STATE_STARTING').which.is.a.Number();
			});
		});

		describe('.STATE_STOPPED', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('STATE_STOPPED').which.is.a.Number();
			});
		});

		describe('.STATE_STOPPING', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('STATE_STOPPING').which.is.a.Number();
			});
		});

		describe('.STATE_WAITING_FOR_DATA', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('STATE_WAITING_FOR_DATA').which.is.a.Number();
			});
		});

		describe('.STATE_WAITING_FOR_QUEUE', () => {
			it('is a Number', () => {
				should(audioPlayer).have.a.constant('STATE_WAITING_FOR_QUEUE').which.is.a.Number();
			});
		});

	});

	it.ios('TIMOB-26533', function (finish) {
		//	Ti.Media.Audio player without url set is crashing while registering for event listener
		audioPlayer = null;
		audioPlayer = Ti.Media.createAudioPlayer();

		try {
			audioPlayer.addEventListener('progress', function () {});
		} catch (e) {
			return finish(e);
		}
		finish();
	});
});
