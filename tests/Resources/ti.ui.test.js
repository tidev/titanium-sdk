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
const utilities = require('./utilities/utilities');

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

	it('.SEMANTIC_COLOR_TYPE_DARK', () => {
		should(Ti.UI).have.a.constant('SEMANTIC_COLOR_TYPE_DARK').which.is.a.String;
	});

	it('.SEMANTIC_COLOR_TYPE_LIGHT', () => {
		should(Ti.UI).have.a.constant('SEMANTIC_COLOR_TYPE_LIGHT').which.is.a.String;
	});

	it('.semanticColorType defaults to SEMANTIC_COLOR_TYPE_LIGHT', () => {
		should(Ti.UI.semanticColorType).eql(Ti.UI.SEMANTIC_COLOR_TYPE_LIGHT);
	});

	it('.USER_INTERFACE_STYLE_LIGHT', () => {
		should(Ti.UI).have.a.constant('USER_INTERFACE_STYLE_LIGHT').which.is.a.Number;
	});

	it('.USER_INTERFACE_STYLE_DARK', () => {
		should(Ti.UI).have.a.constant('USER_INTERFACE_STYLE_DARK').which.is.a.Number;
	});

	it('.USER_INTERFACE_STYLE_UNSPECIFIED', () => {
		should(Ti.UI).have.a.constant('USER_INTERFACE_STYLE_UNSPECIFIED').which.is.a.Number;
	});

	it('.userInterfaceStyle defaults to USER_INTERFACE_STYLE_LIGHT', () => {
		// FIXME: we can't gurantee the emulator theme didn't get changed. Just specify it has to be one of the constants?
		should(Ti.UI.userInterfaceStyle).eql(Ti.UI.USER_INTERFACE_STYLE_LIGHT);
	});

	describe('Semantic Colors', () => {
		const isIOS = (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad');
		const isIOS13Plus = isIOS && parseInt(Ti.Platform.version.split('.')[0]) >= 13;

		it('#fetchSemanticColor() with user colors', () => {
			const semanticColors = require('./semantic.colors.json');

			const result = Ti.UI.fetchSemanticColor('textColor');
			if (isIOS13Plus) {
				// We get a Ti.UI.Color proxy on iOS 13+
				should(result).be.an.Object;
				should(result.apiName).eql('Ti.UI.Color');
				result.toHex().toLowerCase().should.eql(semanticColors.textColor[Ti.UI.semanticColorType].toLowerCase());
			} else {
				// check alpha values
				const green100 = Ti.UI.fetchSemanticColor('green_100.0');
				const blue75 = Ti.UI.fetchSemanticColor('blue_75.0');
				const cyan50 = Ti.UI.fetchSemanticColor('cyan_50.0');
				const red25 = Ti.UI.fetchSemanticColor('red_25.0');
				const magenta0 = Ti.UI.fetchSemanticColor('magenta_0');
				const yellowNoAlpha = Ti.UI.fetchSemanticColor('yellow_noalpha');
				const greenHex8 = Ti.UI.fetchSemanticColor('green_hex8');
				if (Ti.UI.userInterfaceStyle === Ti.UI.USER_INTERFACE_STYLE_LIGHT) {
					result.should.eql('rgba(255, 31, 31, 1.000)');
					green100.should.eql('rgba(0, 255, 0, 1.000)');
					blue75.should.eql('rgba(0, 0, 255, 0.750)');
					cyan50.should.eql('rgba(0, 255, 255, 0.500)');
					red25.should.eql('rgba(255, 0, 0, 0.250)');
					magenta0.should.eql('rgba(255, 0, 255, 0.000)');
					yellowNoAlpha.should.eql('rgba(255, 255, 0, 1.000)');
					greenHex8.should.eql('rgba(0, 255, 0, 0.502)'); // NOTE: hex => % gives more precise value, but this will effectively become 50% under the covers
				} else {
					result.should.eql('rgba(255, 133, 226, 1.000)');
					green100.should.eql('rgba(0, 128, 0, 1.000)');
					blue75.should.eql('rgba(0, 0, 128, 0.750)');
					cyan50.should.eql('rgba(0, 128, 128, 0.500)');
					red25.should.eql('rgba(128, 0, 0, 0.250)');
					magenta0.should.eql('rgba(128, 0, 128, 0.000)');
					yellowNoAlpha.should.eql('rgba(128, 128, 0, 1.000)');
					greenHex8.should.eql('rgba(0, 128, 0, 0.502)'); // NOTE: hex => % gives more precise value, but this will effectively become 50% under the covers
				}
			}
		});

		it('#fetchSemanticColor() with system colors', () => {
			if (isIOS13Plus) {
				const colors = [
					'systemredcolor', 'systemgreencolor', 'systembluecolor',
					'systemorangecolor', 'systemyellowcolor', 'systempinkcolor',
					'systempurplecolor', 'systemtealcolor', 'systemgraycolor',
					'systemindigocolor', 'systemgray2color', 'systemgray3color',
					'systemgray4color',	'systemgray5color', 'systemgray6color',
					'labelcolor',
					'secondarylabelcolor',
					'tertiarylabelcolor',
					'quaternarylabelcolor',
					'linkColor',
					'placeholdertextcolor',
					'separatorcolor',
					'opaqueseparatorcolor',
					'systembackgroundcolor',
					'secondarysystembackgroundcolor',
					'tertiarysystembackgroundcolor',
					'systemgroupedbackgroundcolor',
					'secondarysystemgroupedbackgroundcolor',
					'tertiarysystemgroupedbackgroundcolor',
					'systemfillcolor',
					'secondarysystemfillcolor',
					'tertiarysystemfillcolor',
					'quaternarysystemfillcolor' ];
				for (const color of colors) {
					// TODO: Check against known values?
					Ti.UI.fetchSemanticColor(color).toHex().should.not.eql('#000000');
				}
			} else if (utilities.isAndroid()) {
				// https://developer.android.com/reference/android/R.color
				const colors = new Map([
					[ 'background_dark', '#ff000000' ],
					[ 'background_light', '#ffffffff' ],
					[ 'black', '#ff000000' ],
					[ 'darker_gray', '#ffaaaaaa' ],
					[ 'holo_blue_bright', '#ff00ddff' ],
					[ 'holo_blue_dark', '#ff0099cc' ],
					[ 'holo_blue_light', '#ff33b5e5' ],
					[ 'holo_green_dark', '#ff669900' ],
					[ 'holo_green_light', '#ff99cc00' ],
					[ 'holo_orange_dark', '#ffff8800' ],
					[ 'holo_orange_light', '#ffffbb33' ],
					[ 'holo_purple', '#ffaa66cc' ],
					[ 'holo_red_dark', '#ffcc0000' ],
					[ 'holo_red_light', '#ffff4444' ],
					[ 'primary_text_dark', '#ffffffff' ],
					[ 'primary_text_dark_nodisable', '#ffffffff' ],
					[ 'primary_text_light', '#ff000000' ],
					[ 'primary_text_light_nodisable', '#ff000000' ],
					[ 'secondary_text_dark', '#ffbebebe' ],
					[ 'secondary_text_dark_nodisable', '#ffbebebe' ],
					[ 'secondary_text_light', '#ff323232' ],
					[ 'secondary_text_light_nodisable', '#ffbebebe' ],
					[ 'tab_indicator_text', '#ff808080' ],
					[ 'tertiary_text_dark', '#ff808080' ],
					[ 'tertiary_text_light', '#ff808080' ],
					[ 'transparent', '#00000000' ],
					[ 'white', '#ffffffff' ],
					[ 'widget_edittext_dark', '#ff000000' ],
				]);
				for (const [ colorName, hex ] of colors) {
					const c = Ti.UI.fetchSemanticColor(colorName);
					c.toLowerCase().should.eql(hex);
				}
			}
		});

		it('use semantic colors via color properties', function () {
			should(function () {
				win = Ti.UI.createWindow();
				const label = Ti.UI.createLabel({
					color: 'holo_blue_bright',
					text: 'Hiiiiiiiiiiiiiiiii'
				});

				const view = Ti.UI.createView({
					backgroundColor: '#fff'
				});

				view.add(label);
				win.add(view);
				win.open();
			}).not.throw();
		});
	});

	// TODO Write tests for Ti.UI.global properties below!
	// it('backgroundColor');
	// it('backgroundImage');
	// it('currentTab');

	// it.ios('tintColor');
});
