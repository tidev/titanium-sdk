/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_ANDROID, OS_IOS, OS_VERSION_MAJOR */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint-disable mocha/no-identical-title */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.Media', () => {
	it('#createAudioRecorder()', () => should(Ti.Media.createAudioRecorder).be.a.Function());
});

describe('Titanium.Media.AudioRecorder', () => {
	let recorder;

	beforeEach(() => {
		recorder = Ti.Media.createAudioRecorder();
	});

	afterEach(() => {
		recorder = null;
	});

	describe('properties', () => {
		describe('.apiName', () => {
			it('is a String', () => {
				should(recorder).have.a.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.Media.AudioRecorder', () => {
				should(recorder.apiName).eql('Ti.Media.AudioRecorder');
			});
		});

		// TOOD: document/expose this on Android. Should likely always be LINEAR_PCM and read-only there.
		describe.ios('.compression', () => {
			it('is a Number', () => {
				should(recorder).have.a.property('compression').which.is.a.Number();
			});

			it('defaults to Titanium.Media.AUDIO_FORMAT_LINEAR_PCM', () => {
				should(recorder.compression).eql(Titanium.Media.AUDIO_FORMAT_LINEAR_PCM);
			});

			it('is one of Ti.Media.AUDIO_FORMAT_*', () => {
				should([
					Ti.Media.AUDIO_FORMAT_AAC,
					Ti.Media.AUDIO_FORMAT_ALAW,
					Ti.Media.AUDIO_FORMAT_APPLE_LOSSLESS,
					Ti.Media.AUDIO_FORMAT_ILBC,
					Ti.Media.AUDIO_FORMAT_IMA4,
					Ti.Media.AUDIO_FORMAT_LINEAR_PCM,
					Ti.Media.AUDIO_FORMAT_ULAW,
				]).containEql(recorder.compression);
			});
		});

		// TODO: document/expose this on Android. Should likely always be WAVE and read-only there.
		describe.ios('.format', () => {
			it('is a Number', () => {
				should(recorder).have.a.property('format').which.is.a.Number();
			});

			it('defaults to Titanium.Media.AUDIO_FILEFORMAT_CAF', () => {
				should(recorder.format).eql(Titanium.Media.AUDIO_FILEFORMAT_CAF);
			});

			it('is one of Ti.Media.AUDIO_FILEFORMAT_*', () => {
				should([
					Ti.Media.AUDIO_FILEFORMAT_3GP2,
					Ti.Media.AUDIO_FILEFORMAT_3GPP,
					Ti.Media.AUDIO_FILEFORMAT_AIFF,
					Ti.Media.AUDIO_FILEFORMAT_AMR,
					Ti.Media.AUDIO_FILEFORMAT_CAF,
					Ti.Media.AUDIO_FILEFORMAT_MP3,
					Ti.Media.AUDIO_FILEFORMAT_MP4,
					Ti.Media.AUDIO_FILEFORMAT_MP4A,
					Ti.Media.AUDIO_FILEFORMAT_WAVE,
				]).containEql(recorder.format);
			});
		});

		describe('.paused', () => {
			it('is a Boolean', () => {
				should(recorder).have.a.readOnlyProperty('paused').which.is.a.Boolean();
			});

			it('is false initially', () => {
				should(recorder.paused).be.false();
			});
		});

		describe('.recording', () => {
			it('is a Boolean', () => {
				should(recorder).have.a.readOnlyProperty('recording').which.is.a.Boolean();
			});

			it('is false initially', () => {
				should(recorder.recording).be.false();
			});
		});

		describe('.stopped', () => {
			it('is a Boolean', () => {
				should(recorder).have.a.readOnlyProperty('stopped').which.is.a.Boolean();
			});

			it('is true initially', () => {
				should(recorder.stopped).be.true();
			});
		});
	});

	describe('methods', () => {
		describe('#pause', () => {
			it('is a Function', () => {
				should(recorder.pause).be.a.Function();
			});
		});

		describe('#resume', () => {
			it('is a Function', () => {
				should(recorder.resume).be.a.Function();
			});
		});

		describe('#start', () => {
			it('is a Function', () => {
				should(recorder.start).be.a.Function();
			});
		});

		describe('#stop', () => {
			it('is a Function', () => {
				should(recorder.stop).be.a.Function();
			});

			it('without starting returns null or undefined object', function () {
				// We can't do this test unless we have access to the device's microphone.
				if (!Ti.Media.canRecord || !Ti.Media.hasAudioRecorderPermissions()) {
					this.skip();
					return;
				}
				if (OS_IOS) {
					Ti.Media.audioSessionCategory = Ti.Media.AUDIO_SESSION_CATEGORY_PLAY_AND_RECORD;
				}
				should(recorder.stop()).be.equalOneOf([ null, undefined ]);
			});
		});
	});

	it('#start, #pause, #resume, #stop', function (finish) {
		// skip on older android since it intermittently hangs forever on android 5 emulator
		if (OS_ANDROID && OS_VERSION_MAJOR < 6) {
			return finish();
		}

		this.slow(5000);
		this.timeout(15000);

		// Required to start recording on iOS.
		if (OS_IOS) {
			Ti.Media.audioSessionCategory = Ti.Media.AUDIO_SESSION_CATEGORY_PLAY_AND_RECORD;
		}

		// We can't do the below tests unless we have access to the device's microphone.
		if (!Ti.Media.canRecord || !Ti.Media.hasAudioRecorderPermissions()) {
			return finish();
		}

		recorder.start();
		if (recorder.recording) {
			try {
				// Recording has started. Continue running the rest of the tests.
				should(recorder.paused).be.false();
				should(recorder.stopped).be.false();
			} catch (err) {
				return finish(err);
			}
		} else {
			try {
				// Failed to start recording. Give up now without failing the test.
				// Note: This happens if microphone exists, but is disconnected or in use.
				should(recorder.paused).be.false();
				should(recorder.stopped).be.true();
			} catch (err) {
				return finish(err);
			}
			return finish();
		}

		Promise.resolve()
			.then(() => {
				return new Promise((resolve) => setTimeout(resolve, 100));
			})
			.then(() => {
				recorder.pause();
				should(recorder.recording).be.false();
				should(recorder.paused).be.true();
				should(recorder.stopped).be.false();
				return new Promise((resolve) => setTimeout(resolve, 100));
			})
			.then(() => {
				recorder.resume();
				should(recorder.recording).be.true();
				should(recorder.paused).be.false();
				should(recorder.stopped).be.false();
				return new Promise((resolve) => setTimeout(resolve, 100));
			})
			.then(() => {
				const file = recorder.stop();
				should(file).be.an.Object();
				should(file.exists()).be.true();
				should(recorder.recording).be.false();
				should(recorder.paused).be.false();
				should(recorder.stopped).be.true();
				return finish();
			})
			.catch(finish);
	});
});
