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
	it.windowsMissing('tintColor/trackTintColor', () => {
		const slider = Ti.UI.createSlider({
			tintColor: 'red',
			trackTintColor: 'green'
		});
		should(slider.tintColor).be.eql('red');
		should(slider.trackTintColor).be.eql('green');
	});
});
