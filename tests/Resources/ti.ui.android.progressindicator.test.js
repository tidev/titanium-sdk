/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe.android('Titanium.UI.Android.ProgressIndicator', function () {
	this.timeout(5000);

	it('apiName', () => {
		const progressIndicator = Ti.UI.Android.createProgressIndicator();
		should(progressIndicator).have.readOnlyProperty('apiName').which.is.a.String();
		should(progressIndicator.apiName).be.eql('Ti.UI.Android.ProgressIndicator');
	});

	it('dialog indeterminant', (finish) => {
		const INITIAL_MESSAGE = 'Initial message...';
		const progressIndicator = Ti.UI.Android.createProgressIndicator({
			message: INITIAL_MESSAGE,
			location: Ti.UI.Android.PROGRESS_INDICATOR_DIALOG,
			type: Ti.UI.Android.PROGRESS_INDICATOR_INDETERMINANT
		});
		should(progressIndicator.message).be.eql(INITIAL_MESSAGE);
		should(progressIndicator.location).be.eql(Ti.UI.Android.PROGRESS_INDICATOR_DIALOG);
		should(progressIndicator.type).be.eql(Ti.UI.Android.PROGRESS_INDICATOR_INDETERMINANT);
		progressIndicator.show();
		setTimeout(() => {
			const UPDATED_MESSAGE = 'Updated message...';
			progressIndicator.message = UPDATED_MESSAGE;
			should(progressIndicator.message).be.eql(UPDATED_MESSAGE);
			setTimeout(() => {
				progressIndicator.hide();
				finish();
			}, 10);
		}, 10);
	});

	it('dialog determinant - min: 0, max: 100', (finish) => {
		const INITIAL_MESSAGE = 'Initial message...';
		const progressIndicator = Ti.UI.Android.createProgressIndicator({
			message: INITIAL_MESSAGE,
			location: Ti.UI.Android.PROGRESS_INDICATOR_DIALOG,
			type: Ti.UI.Android.PROGRESS_INDICATOR_DETERMINANT,
			min: 0,
			max: 100,
			value: 0
		});
		should(progressIndicator.message).be.eql(INITIAL_MESSAGE);
		should(progressIndicator.location).be.eql(Ti.UI.Android.PROGRESS_INDICATOR_DIALOG);
		should(progressIndicator.type).be.eql(Ti.UI.Android.PROGRESS_INDICATOR_DETERMINANT);
		should(progressIndicator.min).be.eql(0);
		should(progressIndicator.max).be.eql(100);
		should(progressIndicator.value).be.eql(0);
		progressIndicator.show();
		setTimeout(() => {
			const UPDATED_MESSAGE = 'Updated message...';
			progressIndicator.message = UPDATED_MESSAGE;
			progressIndicator.value = 50;
			should(progressIndicator.message).be.eql(UPDATED_MESSAGE);
			should(progressIndicator.value).be.eql(50);
			setTimeout(() => {
				progressIndicator.value = 100;
				should(progressIndicator.value).be.eql(100);
				setTimeout(() => {
					progressIndicator.hide();
					finish();
				}, 10);
			}, 10);
		}, 10);
	});

	it('dialog determinant - min: 50, max: 100', (finish) => {
		const progressIndicator = Ti.UI.Android.createProgressIndicator({
			message: 'Progressing...',
			location: Ti.UI.Android.PROGRESS_INDICATOR_DIALOG,
			type: Ti.UI.Android.PROGRESS_INDICATOR_DETERMINANT,
			min: 50,
			max: 100,
			value: 50
		});
		should(progressIndicator.min).be.eql(50);
		should(progressIndicator.max).be.eql(100);
		should(progressIndicator.value).be.eql(50);
		progressIndicator.show();
		setTimeout(() => {
			progressIndicator.value = 75;
			should(progressIndicator.value).be.eql(75);
			setTimeout(() => {
				progressIndicator.value = 100;
				should(progressIndicator.value).be.eql(100);
				setTimeout(() => {
					progressIndicator.hide();
					finish();
				}, 10);
			}, 10);
		}, 10);
	});

	it('dialog determinant - exceed min/max', (finish) => {
		const progressIndicator = Ti.UI.Android.createProgressIndicator({
			message: 'Progressing...',
			location: Ti.UI.Android.PROGRESS_INDICATOR_DIALOG,
			type: Ti.UI.Android.PROGRESS_INDICATOR_DETERMINANT,
			min: 0,
			max: 100,
		});
		progressIndicator.show();
		setTimeout(() => {
			try {
				progressIndicator.value = -50;
				progressIndicator.value = 150;
				progressIndicator.hide();
				finish();
			} catch (err) {
				finish(err);
			}
		}, 10);
	});

	it('dialog indeterminant - show twice', function (finish) {
		const progressIndicator = Ti.UI.Android.createProgressIndicator({
			message: 'Progressing...',
			location: Ti.UI.Android.PROGRESS_INDICATOR_DIALOG,
			type: Ti.UI.Android.PROGRESS_INDICATOR_INDETERMINANT
		});
		progressIndicator.show();
		setTimeout(() => {
			progressIndicator.hide();
			setTimeout(() => {
				const UPDATED_MESSAGE = 'Updated message...';
				progressIndicator.message = UPDATED_MESSAGE;
				progressIndicator.show();
				setTimeout(() => {
					should(progressIndicator.message).be.eql(UPDATED_MESSAGE);
					progressIndicator.hide();
					finish();
				}, 10);
			}, 10);
		}, 10);
	});

	it('dialog indeterminant - show in different windows', function (finish) {
		const progressIndicator = Ti.UI.Android.createProgressIndicator({
			message: 'Progressing...',
			location: Ti.UI.Android.PROGRESS_INDICATOR_DIALOG,
			type: Ti.UI.Android.PROGRESS_INDICATOR_INDETERMINANT
		});
		const window1 = Ti.UI.createWindow();
		window1.addEventListener('open', () => {
			progressIndicator.show();
			setTimeout(() => {
				progressIndicator.hide();
				window1.close();
			}, 10);
		});
		window1.addEventListener('close', () => {
			const window2 = Ti.UI.createWindow();
			window2.addEventListener('open', () => {
				progressIndicator.show();
				setTimeout(() => {
					progressIndicator.hide();
					window2.close();
				}, 10);
			});
			window2.addEventListener('close', () => {
				finish();
			});
			window2.open();
		});
		window1.open();
	});

	it('dialog indeterminant - show/hide back-to-back', function () {
		const progressIndicator = Ti.UI.Android.createProgressIndicator({
			message: 'Progressing...',
			location: Ti.UI.Android.PROGRESS_INDICATOR_DIALOG,
			type: Ti.UI.Android.PROGRESS_INDICATOR_INDETERMINANT
		});
		progressIndicator.show();
		progressIndicator.hide();
	});

	it('dialog indeterminant - show while already shown', function () {
		const progressIndicator = Ti.UI.Android.createProgressIndicator({
			message: 'Progressing...',
			location: Ti.UI.Android.PROGRESS_INDICATOR_DIALOG,
			type: Ti.UI.Android.PROGRESS_INDICATOR_INDETERMINANT
		});
		progressIndicator.show();
		progressIndicator.show(); // <- Should do nothing.
		progressIndicator.hide();
	});

	it('dialog indeterminant - hide while already hidden', function () {
		const progressIndicator = Ti.UI.Android.createProgressIndicator({
			message: 'Progressing...',
			location: Ti.UI.Android.PROGRESS_INDICATOR_DIALOG,
			type: Ti.UI.Android.PROGRESS_INDICATOR_INDETERMINANT
		});
		progressIndicator.hide(); // <- Should do nothing.
		progressIndicator.show();
		progressIndicator.hide();
		progressIndicator.hide(); // <- Should do nothing.
	});
});
