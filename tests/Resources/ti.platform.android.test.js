/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint no-undef: "off" */
'use strict';

const should = require('./utilities/assertions');

describe.android('Titanium.Platform.Android', () => {

	describe('.API_LEVEL', () => {
		it('is a Number', () => {
			should(Ti.Platform.Android).have.a.constant('API_LEVEL').which.is.a.Number();
		});
	});

	describe('.apiName', () => {
		it('is a String', () => {
			should(Ti.Platform.Android).have.a.readOnlyProperty('apiName').which.is.a.String();
		});

		it('equals Ti.Platform.Android', () => {
			should(Ti.Platform.Android.apiName).eql('Ti.Platform.Android');
		});
	});

	describe('.PHYSICAL_SIZE_CATEGORY_LARGE', () => {
		it('is a Number', () => {
			should(Ti.Platform.Android).have.a.constant('PHYSICAL_SIZE_CATEGORY_LARGE').which.is.a.Number();
		});
	});

	describe('.PHYSICAL_SIZE_CATEGORY_NORMAL', () => {
		it('is a Number', () => {
			should(Ti.Platform.Android).have.a.constant('PHYSICAL_SIZE_CATEGORY_NORMAL').which.is.a.Number();
		});
	});

	describe('.PHYSICAL_SIZE_CATEGORY_SMALL', () => {
		it('is a Number', () => {
			should(Ti.Platform.Android).have.a.constant('PHYSICAL_SIZE_CATEGORY_SMALL').which.is.a.Number();
		});
	});

	describe('.PHYSICAL_SIZE_CATEGORY_UNDEFINED', () => {
		it('is a Number', () => {
			should(Ti.Platform.Android).have.a.constant('PHYSICAL_SIZE_CATEGORY_UNDEFINED').which.is.a.Number();
		});
	});

	describe('.PHYSICAL_SIZE_CATEGORY_XLARGE', () => {
		it('is a Number', () => {
			should(Ti.Platform.Android).have.a.constant('PHYSICAL_SIZE_CATEGORY_XLARGE').which.is.a.Number();
		});
	});

	describe('.physicalSizeCategory', () => {
		it('is a Number', () => {
			should(Ti.Platform.Android).have.a.readOnlyProperty('physicalSizeCategory').which.is.a.Number();
		});

		it('is one of PHYSICAL_SIZE_CATEGORY_* constants', () => {
			should([
				Ti.Platform.Android.PHYSICAL_SIZE_CATEGORY_LARGE,
				Ti.Platform.Android.PHYSICAL_SIZE_CATEGORY_NORMAL,
				Ti.Platform.Android.PHYSICAL_SIZE_CATEGORY_SMALL,
				Ti.Platform.Android.PHYSICAL_SIZE_CATEGORY_UNDEFINED,
				Ti.Platform.Android.PHYSICAL_SIZE_CATEGORY_XLARGE,
			]).containEql(Ti.Platform.Android.physicalSizeCategory);
		});
	});

});
