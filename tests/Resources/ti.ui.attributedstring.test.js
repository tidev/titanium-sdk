/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_IOS, OS_VERSION_MAJOR */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

const isCI = Ti.App.Properties.getBool('isCI', false);

describe('Titanium.UI', () => {
	it('#createAttributedString()', () => {
		should(Ti.UI.createAttributedString).be.a.Function();
		const attributedString = Ti.UI.createAttributedString({
			text: 'abc'
		});

		should(attributedString).be.a.Object();
	});
});

describe('Titanium.UI.AttributedString', function () {
	it('apiName', () => {
		const attributedString = Ti.UI.createAttributedString({
			text: 'abc'
		});
		should(attributedString).have.readOnlyProperty('apiName').which.is.a.String();
		should(attributedString.apiName).be.eql('Ti.UI.AttributedString');
	});

	it('.text', () => {
		const attributedString = Ti.UI.createAttributedString({
			text: 'abc'
		});
		should(attributedString.text).be.a.String();
		should(attributedString.text).be.eql('abc');
	});

	it('.attributes', function () {
		const str = 'Lorem ipsum dolor sit amet.';
		const attributedString = Ti.UI.createAttributedString({
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

	it('colored link', () => {
		// FIXME: Does not honour scale correctly on macOS: https://jira-archive.titaniumsdk.com/TIMOB-28261
		if (isCI && utilities.isMacOS() && OS_VERSION_MAJOR < 11) {
			return;
		}

		const view = Ti.UI.createView({
			width: '960px',
			height: '220px'
		});
		const label = Ti.UI.createLabel({
			attributedString: Ti.UI.createAttributedString({
				text: 'Check out the Appcelerator Developer Portal',
				attributes: [
					{
						type: Ti.UI.ATTRIBUTE_LINK,
						value: 'https://titaniumsdk.com',
						range: [ 14, 29 ]
					},
					{
						type: Ti.UI.ATTRIBUTE_FOREGROUND_COLOR,
						value: 'purple',
						range: [ 14, 29 ]
					},
					{
						type: Ti.UI.ATTRIBUTE_UNDERLINE_COLOR,
						value: 'orange',
						range: [ 14, 29 ]
					}
				]
			})
		});

		view.add(label);

		should(view).matchImage('snapshots/attributedString_coloredLink.png', { maxPixelMismatch: OS_IOS ? 2 : 0 }); // 2 pixels differ on actual iPhone
	});
});
