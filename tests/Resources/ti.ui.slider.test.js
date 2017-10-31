/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.UI.Slider', function () {
	it('Ti.UI.Slider', function () {
		should(Ti.UI.Slider).not.be.undefined;
	});

	it('apiName', function () {
		var slider = Ti.UI.createSlider();
		should(slider).have.readOnlyProperty('apiName').which.is.a.String;
		should(slider.apiName).be.eql('Ti.UI.Slider');
	});

	it('createSlider', function () {
		should(Ti.UI.createSlider).not.be.undefined;
		should(Ti.UI.createSlider).be.a.Function;

		// Create slider
		var slider = Ti.UI.createSlider({ min: 0, max: 100, value: 50 });
		should(slider).be.a.Object;
		should(slider.apiName).be.a.String;
		should(slider.apiName).be.eql('Ti.UI.Slider');

		// Validate slider value
		Ti.API.info('Slider value : ' + slider.value);
		should(slider.value).be.eql(50);
		slider.value = 25;
		should(slider.value).be.eql(25);
	});
});
