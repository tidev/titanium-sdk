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

	this.timeout(5000);

	afterEach((done) => {
		if (win) {
			let t = setTimeout(function () {
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

	it('change event', (finish) => {
		win = Ti.UI.createWindow();
		const slider = Ti.UI.createSlider({ min: 0, max: 100, value: 50 });
		win.add(slider);
		win.addEventListener('open', () => {
			slider.addEventListener('change', (e) => {
				try {
					should(e.value).be.a.Number();
					should(e.value).be.eql(75);
					should(e.isTrusted).be.a.Boolean();
					should(e.isTrusted).be.false();
					should(e.source).be.eql(slider);
					finish();
				} catch (err) {
					finish(err);
				}
			});
			slider.value = 75;
		});
		win.open();
	});
});
