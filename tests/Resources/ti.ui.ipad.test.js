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

describe.ipad('Titanium.UI.iPad', () => {
	describe('properties', () => {
		describe('.apiName', () => {
			it('is a String', () => {
				should(Ti.UI.iPad).have.a.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.UI.iPad', () => {
				should(Ti.UI.iPad.apiName).eql('Ti.UI.iPad');
			});
		});

	});

	describe('constants', () => {
		describe('.POPOVER_ARROW_DIRECTION_ANY', () => {
			it('is a Number', () => {
				should(Ti.UI.iPad).have.a.constant('POPOVER_ARROW_DIRECTION_ANY').which.is.a.Number();
			});
		});

		describe('.POPOVER_ARROW_DIRECTION_DOWN', () => {
			it('is a Number', () => {
				should(Ti.UI.iPad).have.a.constant('POPOVER_ARROW_DIRECTION_DOWN').which.is.a.Number();
			});
		});

		describe('.POPOVER_ARROW_DIRECTION_LEFT', () => {
			it('is a Number', () => {
				should(Ti.UI.iPad).have.a.constant('POPOVER_ARROW_DIRECTION_LEFT').which.is.a.Number();
			});
		});

		describe('.POPOVER_ARROW_DIRECTION_RIGHT', () => {
			it('is a Number', () => {
				should(Ti.UI.iPad).have.a.constant('POPOVER_ARROW_DIRECTION_RIGHT').which.is.a.Number();
			});
		});

		describe('.POPOVER_ARROW_DIRECTION_UNKNOWN', () => {
			it('is a Number', () => {
				should(Ti.UI.iPad).have.a.constant('POPOVER_ARROW_DIRECTION_UNKNOWN').which.is.a.Number();
			});
		});

		describe('.POPOVER_ARROW_DIRECTION_UP', () => {
			it('is a Number', () => {
				should(Ti.UI.iPad).have.a.constant('POPOVER_ARROW_DIRECTION_UP').which.is.a.Number();
			});
		});

	});
});
