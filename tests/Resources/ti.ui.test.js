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

describe('Titanium.UI', function () {
	let win;

	this.timeout(5000);

	afterEach(function (done) {
		if (win) {
			// If `win` is already closed, we're done.
			let t = setTimeout(function () {
				if (win) {
					win = null;
					done();
				}
			}, 3000);

			win.addEventListener('close', function listener () {
				clearTimeout(t);

				if (win) {
					win.removeEventListener('close', listener);
				}
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it.windowsBroken('#convertUnits()', function () {
		// This should use the default unit to do the conversion! For our test app, that is 'dp' (or dip)
		// FIXME iOS has some funky code here, setting assumed units to "dpi", which is not a real unit and then assuming it's dip without consulting the default unit property
		it('converts 100 unspecified units to px', function () {
			// dip -> px, so should be logicalDensityFactor * value
			var logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
			should(Ti.UI.convertUnits('100', Ti.UI.UNIT_PX)).be.approximately(100 * logicalDensityFactor, 0.001);
		});
		// TODO test unspecified to cm/mm/dip/in

		// cm -> dip
		it('returns 2.54 cm = (dpi / logicalDensityFactor) dip', function () {
			var logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
			var dpi = Ti.Platform.displayCaps.dpi;
			should(Ti.UI.convertUnits('2.54cm', Ti.UI.UNIT_DIP)).be.approximately((dpi / logicalDensityFactor), 0.0001);
		});

		// cm -> in
		it('returns 1cm = 0.0393701 in', function () {
			should(Ti.UI.convertUnits('1cm', Ti.UI.UNIT_IN)).be.approximately(0.393701, 0.0001);
		});

		// cm -> mm
		it('returns cm to mm as x * 10', function () {
			should(Ti.UI.convertUnits('100cm', Ti.UI.UNIT_MM)).be.approximately(1000, 0.001);
		});

		// cm -> px
		// since 2.54cm = 1in, then in pixels it should equal dpi (dots per inch!)
		it('returns 2.54cm = dpi pixels', function () {
			var dpi = Ti.Platform.displayCaps.dpi;
			should(Ti.UI.convertUnits('2.54cm', Ti.UI.UNIT_PX)).be.approximately(dpi, 0.0001);
		});

		// dip -> cm
		it('returns (dpi / logicalDensityFactor) dip = 2.54 cm', function () {
			var logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
			var dpi = Ti.Platform.displayCaps.dpi;
			should(Ti.UI.convertUnits((dpi / logicalDensityFactor) + 'dip', Ti.UI.UNIT_CM)).be.approximately(2.54, 0.0001);
		});

		// dip -> in
		it('returns (dpi / logicalDensityFactor) dip = 1 in', function () {
			var logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
			var dpi = Ti.Platform.displayCaps.dpi;
			should(Ti.UI.convertUnits((dpi / logicalDensityFactor) + 'dip', Ti.UI.UNIT_IN)).be.approximately(1, 0.0001);
		});

		// dip -> mm
		it('returns (dpi / logicalDensityFactor) dip = 25.4 mm', function () {
			var logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
			var dpi = Ti.Platform.displayCaps.dpi;
			should(Ti.UI.convertUnits((dpi / logicalDensityFactor) + 'dip', Ti.UI.UNIT_MM)).be.approximately(25.4, 0.0001);
		});

		// dip -> px
		it('returns Ti.Platform.DisplayCaps.logicalDensityFactory for 1dip to pixels', function () {
			var logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
			should(Ti.UI.convertUnits('1dip', Ti.UI.UNIT_PX)).be.approximately(logicalDensityFactor, 0.5);
		});

		// inches -> cm
		it('returns 1 in = 2.54 cm', function () {
			should(Ti.UI.convertUnits('1in', Ti.UI.UNIT_CM)).be.approximately(2.54, 0.0001);
		});

		// inches -> dip
		it('returns 1 in = (dpi / logicalDensityFactor) dip', function () {
			var logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
			var dpi = Ti.Platform.displayCaps.dpi;
			should(Ti.UI.convertUnits('1in', Ti.UI.UNIT_DIP)).be.approximately((dpi / logicalDensityFactor), 0.0001);
		});

		// inches -> mm
		it('returns 1 in = 25.4 mm', function () {
			should(Ti.UI.convertUnits('1in', Ti.UI.UNIT_MM)).be.approximately(25.4, 0.0001);
		});

		// inches -> pixels
		it('converts 1 in = dpi pixels', function () {
			var dpi = Ti.Platform.displayCaps.dpi;
			should(Ti.UI.convertUnits('1in', Ti.UI.UNIT_PX)).eql(dpi);
		});

		// mm -> cm
		it('returns 100 mm = 10 cm', function () {
			should(Ti.UI.convertUnits('100mm', Ti.UI.UNIT_CM)).be.approximately(10, 0.001);
		});

		// mm -> dip
		it('returns 25.4 mm = (dpi / logicalDensityFactor) dip', function () {
			var logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
			var dpi = Ti.Platform.displayCaps.dpi;
			should(Ti.UI.convertUnits('25.4mm', Ti.UI.UNIT_DIP)).be.approximately((dpi / logicalDensityFactor), 0.0001);
		});

		// mm -> in
		it('returns 1mm = 0.0393701in', function () {
			should(Ti.UI.convertUnits('1mm', Ti.UI.UNIT_IN)).be.approximately(0.0393701, 0.0001);
		});

		// mm -> px
		// since 25.4mm/2.54cm = 1in, then in pixels it should equal dpi (dots per inch!)
		it('returns 25.4 mm = dpi pixels', function () {
			var dpi = Ti.Platform.displayCaps.dpi;
			should(Ti.UI.convertUnits('25.4mm', Ti.UI.UNIT_PX)).be.approximately(dpi, 0.0001);
		});

		// px -> cm
		// since 2.54cm = 1in, dpi pixels = 1in, so dpi px should = 2.54cm
		it('returns dpi pixels = 2.54 cm', function () {
			var dpi = Ti.Platform.displayCaps.dpi;
			should(Ti.UI.convertUnits(dpi + 'px', Ti.UI.UNIT_CM)).be.approximately(2.54, 0.0001);
		});

		// px -> dip
		it('returns Ti.Platform.DisplayCaps.logicalDensityFactory pixels = 1 dip', function () {
			var logicalDensityFactor = Ti.Platform.displayCaps.logicalDensityFactor;
			should(Ti.UI.convertUnits(logicalDensityFactor + 'px', Ti.UI.UNIT_DIP)).be.approximately(1, 0.001);
		});

		// px -> in
		// If we try to convert dpi pixels to inches, it should be 1 inch (because dpi itself is pixels per inch)
		it('converts dpi pixels = 1 in', function () {
			var dpi = Ti.Platform.displayCaps.dpi;
			should(Ti.UI.convertUnits(dpi + 'px', Ti.UI.UNIT_IN)).eql(1);
		});

		// px -> mm
		// since 2.54cm = 1in, dpi pixels = 1in, so dpi px should = 25.4cm
		it('returns dpi pixels = 25.4 mm', function () {
			var dpi = Ti.Platform.displayCaps.dpi;
			should(Ti.UI.convertUnits(dpi + 'px', Ti.UI.UNIT_MM)).be.approximately(25.4, 0.0001);
		});

		// TODO try "converting" a unit to itself, assume we get exact same value!

		it.androidBroken('returns 0 if percentage used', function () {
			should(Ti.UI.convertUnits('100%', Ti.UI.UNIT_CM)).eql(0); // FIXME Android "expected -0.015875 to equal 0"
			should(Ti.UI.convertUnits('5%', Ti.UI.UNIT_DIP)).eql(0);
			should(Ti.UI.convertUnits('12%', Ti.UI.UNIT_IN)).eql(0);
			should(Ti.UI.convertUnits('65%', Ti.UI.UNIT_MM)).eql(0);
			should(Ti.UI.convertUnits('20%', Ti.UI.UNIT_PX)).eql(0);
		});

		// 1097
		it('returns 0 if non-numeric value passed in', function () {
			should(Ti.UI.convertUnits('abc', Ti.UI.UNIT_CM)).eql(0);
			should(Ti.UI.convertUnits('abc', Ti.UI.UNIT_DIP)).eql(0);
			should(Ti.UI.convertUnits('abc', Ti.UI.UNIT_IN)).eql(0);
			should(Ti.UI.convertUnits('abc', Ti.UI.UNIT_MM)).eql(0);
			should(Ti.UI.convertUnits('abc', Ti.UI.UNIT_PX)).eql(0);
		});

		// TODO Test that 'dp' and 'dip' suffix are both UNIT_DIP
	});

	// Constants are tested in ti.ui.constants.test.js

	it('.SEMANTIC_COLOR_TYPE_DARK', function () {
		should(Ti.UI).have.a.constant('SEMANTIC_COLOR_TYPE_DARK').which.is.a.string;
	});

	it('.SEMANTIC_COLOR_TYPE_LIGHT', function () {
		should(Ti.UI).have.a.constant('SEMANTIC_COLOR_TYPE_LIGHT').which.is.a.string;
	});

	it('.semanticColorType defaults to SEMANTIC_COLOR_TYPE_LIGHT', function () {
		should(Ti.UI.semanticColorType).eql(Ti.UI.SEMANTIC_COLOR_TYPE_LIGHT);
	});

	it.only('#fetchSemanticColor()', function () {
		const semanticColors = require('./semantic.colors.json');

		const result = Ti.UI.fetchSemanticColor('textColor');
		should(result).be.an.Object;
		should(result.apiName).eql('Ti.UI.Color');
		// should be either the dark mode or light mode value. How can we tell what mode it's in?!
		result.toHex().toLowerCase().should.eql(semanticColors.textColor[Ti.UI.semanticColorType].toLowerCase());
	});

	// TODO Write tests for Ti.UI.global properties below!
	// it('backgroundColor');
	// it('backgroundImage');
	// it('currentTab');

	// it.ios('tintColor');
});
