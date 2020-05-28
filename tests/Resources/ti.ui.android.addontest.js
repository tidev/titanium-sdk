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

describe.android('Titanium.UI.Android', () => {
	describe('#getColorResource()', () => {
		it('is a function', () => should(Ti.UI.Android).have.a.property('getColorResource').which.is.a.Function());

		it('handles resource id as argument', () => {
			const result = Ti.UI.Android.getColorResource(Ti.Android.R.color.darker_gray);
			result.toHex().should.eql('#ffaaaaaa');
		});

		it('handles color name as argument', () => {
			const result = Ti.UI.Android.getColorResource('darker_gray');
			result.toHex().should.eql('#ffaaaaaa');
		});

		it('returns null for unknown color name as argument', () => {
			const result = Ti.UI.Android.getColorResource('made_up_color_resource_name');
			should.not.exist(result);
		});

		it('returns null for bad resource id', () => {
			const result = Ti.UI.Android.getColorResource(0);
			should.not.exist(result);
		});
	});
});
