/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: 'off' */
'use strict';

describe('Titanium.UI.Button', function () {

	it('attributedString', function (finish) {
		var button, attr, text;

		text = 'Titanium rocks!';
		attr = Ti.UI.createAttributedString({
			text: text,
			attributes: [
				// Remove underline
				{
					type: Ti.UI.ATTRIBUTE_UNDERLINES_STYLE,
					value: Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_NONE,
					range: [ 0, text.length ]
				}
			]
		});

		button = Ti.UI.createButton({ attributedString: attr });

		should(button.attributedString).be.an.Object;
		should(button.attributedString.text).be.a.String;
		should(button.attributedString.text).eql('Titanium rocks!');
		should(button.attributedString.attributes).be.an.Array;
		should(button.attributedString.attributes[0].type).eql(Ti.UI.ATTRIBUTE_UNDERLINES_STYLE);
		should(button.attributedString.attributes[0].value).eql(Ti.UI.ATTRIBUTE_UNDERLINE_STYLE_NONE);
		should(button.attributedString.attributes[0].range[0]).eql(0);
		should(button.attributedString.attributes[0].range[1]).eql(text.length);

		finish();
	});
});
