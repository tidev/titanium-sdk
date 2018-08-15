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

describe('Titanium.UI.AttributedString', function () {

	it.ios('Ti.UI.AttributedString', function () {
		should(Ti.UI.AttributedString).not.be.undefined;
	});

	it.ios('apiName', function () {
		var attributedString = Ti.UI.createAttributedString({
			text: 'abc'
		});
		should(attributedString).have.readOnlyProperty('apiName').which.is.a.String;
		should(attributedString.apiName).be.eql('Ti.UI.AttributedString');
	});

	it.ios('createAttributedString', function () {
		var attributedString = Ti.UI.createAttributedString({
			text: 'abc'
		});

		should(attributedString).be.a.Object;
		should(attributedString.text).be.a.String;
		should(attributedString.text).be.eql('abc');
	});

	it.ios('attributes', function () {
		var str = 'Lorem ipsum dolor sit amet.';
		var attributedString = Ti.UI.createAttributedString({
			text: str,
			attributes: [ {
				type: Ti.UI.ATTRIBUTE_PARAGRAPH_STYLE,
				value: {
					alignment: Ti.UI.ATTRIBUTE_TEXT_ALIGNMENT_JUSTIFIED,
					minimumLineHeight: 40,
					headIndent: 5,
					lineSpacing: 5
				},
				range: [ 0, str.length ]
			} ]
		});

		should(attributedString.text).be.eql(str);
		should(attributedString.attributes.length).be.eql(1);

		attributedString.addAttribute({
			type: Ti.UI.ATTRIBUTE_FONT,
			value: {
				fontSize: 16
			},
			range: [ 0, str.length ]
		});
		should(attributedString.attributes.length).be.eql(2);
	});
});
