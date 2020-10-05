/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_IOS */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.Media', () => {
	it('#createAudioRecorder()', () => should(Ti.Media.createAudioRecorder).be.a.Function());
});

describe('Titanium.Media.AudioRecorder', function () {
	this.slow(5000);
	this.timeout(15000);

	it('apiName', () => {
		const recorder = Ti.Media.createAudioRecorder();
		should(recorder).have.a.readOnlyProperty('apiName').which.is.a.String();
		should(recorder.apiName).be.eql('Ti.Media.AudioRecorder');
	});

	it('#start, #pause, #resume, #stop', (finish) => {
		const recorder = Ti.Media.createAudioRecorder();
		should(recorder.start).be.a.Function();
		should(recorder.pause).be.a.Function();
		should(recorder.resume).be.a.Function();
		should(recorder.stop).be.a.Function();

		should(recorder.recording).be.false();
		should(recorder.paused).be.false();
		should(recorder.stopped).be.true();

		// Required to start recording on iOS.
		if (OS_IOS) {
			Ti.Media.audioSessionCategory = Ti.Media.AUDIO_SESSION_CATEGORY_PLAY_AND_RECORD;
		}

		// We can't do the below tests unless we have access to the device's microphone.
		if (!Ti.Media.canRecord || !Ti.Media.hasAudioRecorderPermissions()) {
			return finish();
		}

		Ti.API.info('AudioRecorder.start()');
		recorder.start();
		if (recorder.recording) {
			// Recording has started. Continue running the rest of the tests.
			should(recorder.paused).be.false();
			should(recorder.stopped).be.false();
		} else {
			// Failed to start recording. Give up now without failing the test.
			// Note: This happens if microphone exists, but is disconnected or in use.
			should(recorder.paused).be.false();
			should(recorder.stopped).be.true();
			return finish();
		}

		Promise.resolve()
			.then(() => {
				return new Promise((resolve) => setTimeout(resolve, 100));
			})
			.then(() => {
				Ti.API.info('AudioRecorder.pause()');
				recorder.pause();
				should(recorder.recording).be.false();
				should(recorder.paused).be.true();
				should(recorder.stopped).be.false();
				return new Promise((resolve) => setTimeout(resolve, 100));
			})
			.then(() => {
				Ti.API.info('AudioRecorder.resume()');
				recorder.resume();
				should(recorder.recording).be.true();
				should(recorder.paused).be.false();
				should(recorder.stopped).be.false();
				return new Promise((resolve) => setTimeout(resolve, 100));
			})
			.then(() => {
				Ti.API.info('AudioRecorder.stop()');
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

	it('#stop without starting', () => {
		const recorder = Ti.Media.createAudioRecorder();
		should(recorder.stop()).be.equalOneOf([ null, undefined ]);
	});
});
