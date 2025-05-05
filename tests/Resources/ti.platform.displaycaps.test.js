/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint mocha/no-identical-title: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.Platform.DisplayCaps', () => {
	describe('properties', () => {
		describe('.apiName', () => {
			it('is a read-only String', () => {
				should(Ti.Platform.displayCaps).have.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.Platform.DisplayCaps', () => {
				should(Ti.Platform.displayCaps.apiName).be.eql('Ti.Platform.DisplayCaps');
			});
		});

		describe('.density', () => {
			it('is a read-only String', () => {
				should(Ti.Platform.displayCaps).have.readOnlyProperty('density').which.is.a.String();
			});

			it('is one of known values', () => {
				should([
					'xxxhigh', // Android 4x 560+ dpi (note that android's constant is for 640 == xxxhdpi)
					'xxhigh', // Android 3x 400+ dpi (note that android's constant is for 480 == xxhdpi)
					'xhigh', // iOS 3x, Android 280+ dpi (note their constant is for 320dpi == xhdpi!)
					'high', // 2x on iOS, Android 240 dpi (hdpi)
					'tvdpi', // Android 213 dpi (720p TV screen)
					'medium', // 1x on iOS, Android 160 dpi (mdpi)
					'low', // Android < 160 dpi
				]).containEql(Ti.Platform.displayCaps.density);
			});

			it('has no getter', () => {
				should(Ti.Platform.displayCaps).not.have.a.getter('density');
			});
		});

		describe('.dpi', () => {
			it('is a read-only Number', () => {
				should(Ti.Platform.displayCaps).have.readOnlyProperty('dpi').which.is.a.Number();
			});

			it('is above 0', () => {
				should(Ti.Platform.displayCaps.dpi).be.above(0);
			});

			it('has no getter', () => {
				should(Ti.Platform.displayCaps).not.have.a.getter('dpi');
			});
		});

		describe('.logicalDensityFactor', () => {
			it('is a read-only Number', () => {
				should(Ti.Platform.displayCaps).have.readOnlyProperty('logicalDensityFactor').which.is.a.Number();
			});

			it('is above 0', () => {
				should(Ti.Platform.displayCaps.logicalDensityFactor).be.above(0);
			});

			it('has no getter', () => {
				should(Ti.Platform.displayCaps).not.have.a.getter('logicalDensityFactor');
			});
		});

		describe('.platformHeight', () => {
			it('is a read-only Number', () => {
				should(Ti.Platform.displayCaps).have.readOnlyProperty('platformHeight').which.is.a.Number();
			});

			it('is above 0', () => {
				should(Ti.Platform.displayCaps.platformHeight).be.above(0);
			});

			it('has no getter', () => {
				should(Ti.Platform.displayCaps).not.have.a.getter('platformHeight');
			});
		});

		describe('.platformWidth', () => {
			it('is a read-only Number', () => {
				should(Ti.Platform.displayCaps).have.readOnlyProperty('platformWidth').which.is.a.Number();
			});

			it('is above 0', () => {
				should(Ti.Platform.displayCaps.platformWidth).be.above(0);
			});

			it('has no getter', () => {
				should(Ti.Platform.displayCaps).not.have.a.getter('platformWidth');
			});
		});

		describe.android('.xdpi', () => {
			it('is a read-only Number', () => {
				should(Ti.Platform.displayCaps).have.readOnlyProperty('xdpi').which.is.a.Number();
			});

			it('is above 0', () => {
				should(Ti.Platform.displayCaps.xdpi).be.above(0);
			});

			it('has no getter', () => {
				should(Ti.Platform.displayCaps).not.have.a.getter('xdpi');
			});
		});

		describe.android('.ydpi', () => {
			it('is a read-only Number', () => {
				should(Ti.Platform.displayCaps).have.readOnlyProperty('ydpi').which.is.a.Number();
			});

			it('is above 0', () => {
				should(Ti.Platform.displayCaps.ydpi).be.above(0);
			});

			it('has no getter', () => {
				should(Ti.Platform.displayCaps).not.have.a.getter('ydpi');
			});
		});
	});
});
