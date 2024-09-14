/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.Gesture', () => {
	it('namespace/module exists', () => {
		should(Ti.Gesture).not.be.undefined();
		should(Ti.Gesture.addEventListener).be.a.Function();
		should(Ti.Gesture.removeEventListener).be.a.Function();
	});

	describe('properties', () => {
		describe('.apiName', () => {
			it('is a String', () => {
				should(Ti.Gesture).have.a.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.Gesture', () => {
				should(Ti.Gesture.apiName).be.eql('Ti.Gesture');
			});
		});

		describe('.landscape', () => {
			it('is a Boolean', () => {
				should(Ti.Gesture).have.a.readOnlyProperty('landscape').which.is.a.Boolean();
			});

			it('has no getter', () => {
				should(Ti.Gesture).not.have.a.getter('landscape');
			});
		});

		describe('.orientation', () => {
			it('is a Number', () => {
				should(Ti.Gesture).have.a.readOnlyProperty('orientation').which.is.a.Number();
			});

			it('has no getter', () => {
				should(Ti.Gesture).not.have.a.getter('orientation');
			});
		});

		describe('.portrait', () => {
			it('is a Boolean', () => {
				should(Ti.Gesture).have.a.readOnlyProperty('portrait').which.is.a.Boolean();
			});

			it('has no getter', () => {
				should(Ti.Gesture).not.have.a.getter('portrait');
			});
		});
	});

	describe('events', () => {
		it.windowsMissing('orientationchange', () => {
			function listener () {}
			Ti.Gesture.addEventListener('orientationchange', listener);
			Ti.Gesture.removeEventListener('orientationchange', listener);
		});
	});
});
