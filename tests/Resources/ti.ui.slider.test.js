/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.Slider', function () {
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

	it.iosBroken('Ti.UI.Slider', function () { // should this be defined?
		should(Ti.UI.Slider).not.be.undefined();
	});

	it('.apiName', function () {
		const slider = Ti.UI.createSlider();
		should(slider).have.readOnlyProperty('apiName').which.is.a.String();
		should(slider.apiName).eql('Ti.UI.Slider');
	});

	it('createSlider', function () {
		should(Ti.UI.createSlider).not.be.undefined();
		should(Ti.UI.createSlider).be.a.Function();

		// Create slider
		const slider = Ti.UI.createSlider({ min: 0, max: 100, value: 50 });
		should(slider).be.a.Object();
		should(slider.apiName).be.a.String();
		should(slider.apiName).eql('Ti.UI.Slider');

		// Validate slider value
		Ti.API.info('Slider value : ' + slider.value);
		should(slider.value).eql(50);
		slider.value = 25;
		should(slider.value).eql(25);
	});

	it.windowsMissing('tintColor/trackTintColor', () => {
		const slider = Ti.UI.createSlider({
			tintColor: 'red',
			trackTintColor: 'green'
		});
		should(slider.tintColor).eql('red');
		should(slider.trackTintColor).eql('green');
	});

	it('change event', (finish) => {
		win = Ti.UI.createWindow();
		const slider = Ti.UI.createSlider({ min: 0, max: 100, value: 50 });
		win.add(slider);
		win.addEventListener('open', function openListener () {
			win.removeEventListener('open', openListener);
			slider.addEventListener('change', function changeListener (e) {
				slider.removeEventListener('change', changeListener);
				try {
					should(e.value).be.a.Number();
					should(e.value).eql(75);
					should(e.isTrusted).be.a.Boolean();
					should(e.isTrusted).be.false();
					should(e.source).eql(slider);
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			slider.value = 75;
		});
		win.open();
	});
});
