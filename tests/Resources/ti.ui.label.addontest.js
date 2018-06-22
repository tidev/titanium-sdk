/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.Label', function () {
	it.ios('minimumFontSize', function () {
		var label = Ti.UI.createLabel({
			text: 'this is some text',
			textAlign: 'left',
			font: {
				fontSize: 36
			},
			color: 'black',
			wordWrap: false,
			ellipsize: false,
			minimumFontSize: 28,
			height: 50
		});
		should(label.minimumFontSize).be.a.Number;
		should(label.getMinimumFontSize).be.a.Function;
		should(label.minimumFontSize).eql(28);
		should(label.getMinimumFontSize()).eql(28);
		label.minimumFontSize = 22;
		should(label.minimumFontSize).eql(22);
		should(label.getMinimumFontSize()).eql(22);
	});
});
