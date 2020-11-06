/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

const should = require('./utilities/assertions');

describe('Titanium.UI.ActivityIndicator', function () {
	it('.apiName', () => {
		const activityIndicator = Ti.UI.createActivityIndicator();
		should(activityIndicator).have.readOnlyProperty('apiName').which.is.a.String();
		should(activityIndicator.apiName).be.eql('Ti.UI.ActivityIndicator');
	});

	it('.color', function () {
		const activityIndicator = Ti.UI.createActivityIndicator({
			color: '#fff'
		});
		should(activityIndicator.color).be.a.String();
		should(activityIndicator.getColor).be.a.Function();
		should(activityIndicator.color).eql('#fff');
		should(activityIndicator.getColor()).eql('#fff');
		activityIndicator.color = '#000';
		should(activityIndicator.color).eql('#000');
		should(activityIndicator.getColor()).eql('#000');
	});

	it('.font', function () {
		const activityIndicator = Ti.UI.createActivityIndicator({
			font: {
				fontSize: 24,
				fontFamily: 'Segoe UI'
			}
		});
		should(activityIndicator.font).be.a.Object();
		should(activityIndicator.getFont).be.a.Function();
		should(activityIndicator.font.fontSize).eql(24);
		should(activityIndicator.getFont().fontFamily).eql('Segoe UI');
		activityIndicator.font = {
			fontSize: 11,
			fontFamily: 'Segoe UI Semilight'
		};
		should(activityIndicator.font.fontSize).eql(11);
		should(activityIndicator.getFont().fontFamily).eql('Segoe UI Semilight');
	});

	it('.message', function () {
		const activityIndicator = Ti.UI.createActivityIndicator({
			message: 'this is some text'
		});
		should(activityIndicator.message).be.a.String();
		should(activityIndicator.getMessage).be.a.Function();
		should(activityIndicator.message).eql('this is some text');
		should(activityIndicator.getMessage()).eql('this is some text');
		activityIndicator.message = 'other text';
		should(activityIndicator.message).eql('other text');
		should(activityIndicator.getMessage()).eql('other text');
	});

	it('.style', function () {
		const activityIndicator = Ti.UI.createActivityIndicator({
			style: Ti.UI.ActivityIndicatorStyle.BIG
		});
		should(activityIndicator.style).be.a.Number();
		should(activityIndicator.getStyle).be.a.Function();
		should(activityIndicator.style).eql(Ti.UI.ActivityIndicatorStyle.BIG);
		should(activityIndicator.getStyle()).eql(Ti.UI.ActivityIndicatorStyle.BIG);
		activityIndicator.style = Ti.UI.ActivityIndicatorStyle.DARK;
		should(activityIndicator.style).eql(Ti.UI.ActivityIndicatorStyle.DARK);
		should(activityIndicator.getStyle()).eql(Ti.UI.ActivityIndicatorStyle.DARK);
	});

	it('.indicatorColor', function () {
		const activityIndicator = Ti.UI.createActivityIndicator({
			indicatorColor: '#fff'
		});
		should(activityIndicator.indicatorColor).be.a.String();
		should(activityIndicator.getIndicatorColor).be.a.Function();
		should(activityIndicator.indicatorColor).eql('#fff');
		should(activityIndicator.getIndicatorColor()).eql('#fff');
		activityIndicator.indicatorColor = '#000';
		should(activityIndicator.indicatorColor).eql('#000');
		should(activityIndicator.getIndicatorColor()).eql('#000');
	});
});
