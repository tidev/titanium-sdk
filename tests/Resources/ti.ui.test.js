/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* globals OS_ANDROID, OS_IOS, OS_VERSION_MAJOR */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

const isCI = Ti.App.Properties.getBool('isCI', false);

describe('Titanium.UI', function () {
	this.slow(2000);
	this.timeout(5000);

	let win;
	afterEach(done => { // fires after every test in sub-suites too...
		if (win && !win.closed) {
			win.addEventListener('close', function listener () {
				win.removeEventListener('close', listener);
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
		should(Ti.UI).have.a.constant('SEMANTIC_COLOR_TYPE_DARK').which.is.a.String();
	});

	it('.SEMANTIC_COLOR_TYPE_LIGHT', () => {
		should(Ti.UI).have.a.constant('SEMANTIC_COLOR_TYPE_LIGHT').which.is.a.String();
	});

	it('.semanticColorType', () => {
		if (OS_IOS && (OS_VERSION_MAJOR < 13)) {
			should(Ti.UI.semanticColorType).eql(Ti.UI.SEMANTIC_COLOR_TYPE_LIGHT);
		} else {
			should(Ti.UI.semanticColorType).equalOneOf([
				Ti.UI.SEMANTIC_COLOR_TYPE_DARK,
				Ti.UI.SEMANTIC_COLOR_TYPE_LIGHT
			]);
		}
	});

	it('.USER_INTERFACE_STYLE_LIGHT', () => {
		should(Ti.UI).have.a.constant('USER_INTERFACE_STYLE_LIGHT').which.is.a.Number();
	});

	it('.USER_INTERFACE_STYLE_DARK', () => {
		should(Ti.UI).have.a.constant('USER_INTERFACE_STYLE_DARK').which.is.a.Number();
	});

	it('.USER_INTERFACE_STYLE_UNSPECIFIED', () => {
		should(Ti.UI).have.a.constant('USER_INTERFACE_STYLE_UNSPECIFIED').which.is.a.Number();
	});

	it('.userInterfaceStyle', () => {
		if (OS_IOS && (OS_VERSION_MAJOR < 13)) {
			should(Ti.UI.userInterfaceStyle).eql(Ti.UI.USER_INTERFACE_STYLE_LIGHT);
		} else {
			should(Ti.UI.userInterfaceStyle).equalOneOf([
				Ti.UI.USER_INTERFACE_STYLE_DARK,
				Ti.UI.USER_INTERFACE_STYLE_LIGHT,
				Ti.UI.USER_INTERFACE_STYLE_UNSPECIFIED
			]);
		}
	});

	it('.overrideUserInterfaceStyle', () => {
		should(Ti.UI.overrideUserInterfaceStyle).eql(Ti.UI.USER_INTERFACE_STYLE_UNSPECIFIED);
		if (OS_IOS) {
			const originalStyle = Ti.UI.userInterfaceStyle;

			Ti.UI.overrideUserInterfaceStyle = Ti.UI.USER_INTERFACE_STYLE_DARK;
			should(Ti.UI.overrideUserInterfaceStyle).eql(Ti.UI.USER_INTERFACE_STYLE_DARK);
			should(Ti.UI.userInterfaceStyle).eql(Ti.UI.USER_INTERFACE_STYLE_DARK);

			Ti.UI.overrideUserInterfaceStyle = Ti.UI.USER_INTERFACE_STYLE_LIGHT;
			should(Ti.UI.overrideUserInterfaceStyle).eql(Ti.UI.USER_INTERFACE_STYLE_LIGHT);
			should(Ti.UI.userInterfaceStyle).eql(Ti.UI.USER_INTERFACE_STYLE_LIGHT);

			Ti.UI.overrideUserInterfaceStyle = Ti.UI.USER_INTERFACE_STYLE_UNSPECIFIED;
			should(Ti.UI.overrideUserInterfaceStyle).eql(Ti.UI.USER_INTERFACE_STYLE_UNSPECIFIED);
			should(Ti.UI.userInterfaceStyle).eql(originalStyle);
		}
	});

	describe('Semantic Colors', () => {
		const isIOS13Plus = OS_IOS && (OS_VERSION_MAJOR >= 13);

		it('#fetchSemanticColor() with user colors', () => {
			const semanticColors = require('./semantic.colors.json');

			const result = Ti.UI.fetchSemanticColor('textColor');
			if (OS_IOS) {
				// We get a Ti.UI.Color proxy on iOS
				should(result).be.an.Object();
				should(result.apiName).eql('Ti.UI.Color');
				result.toHex().toLowerCase().should.eql(semanticColors.textColor[Ti.UI.semanticColorType].toLowerCase());
			} else {
				function validateColor(colorString, lightColorExpected, darkColorExpected) {
					colorString.should.equalOneOf([
						`ti.semantic.color:${darkColorExpected};${lightColorExpected}`,
						`ti.semantic.color:${lightColorExpected};${darkColorExpected}`,
					]);
				}
				validateColor(result, 'light=rgba(255, 31, 31, 1.000)', 'dark=rgba(255, 133, 226, 1.000)');
				validateColor(
					Ti.UI.fetchSemanticColor('green_100.0'),
					'light=rgba(0, 255, 0, 1.000)',
					'dark=rgba(0, 128, 0, 1.000)'
				);
				validateColor(
					Ti.UI.fetchSemanticColor('blue_75.0'),
					'light=rgba(0, 0, 255, 0.750)',
					'dark=rgba(0, 0, 128, 0.750)'
				);
				validateColor(
					Ti.UI.fetchSemanticColor('cyan_50.0'),
					'light=rgba(0, 255, 255, 0.500)',
					'dark=rgba(0, 128, 128, 0.500)'
				);
				validateColor(
					Ti.UI.fetchSemanticColor('red_25.0'),
					'light=rgba(255, 0, 0, 0.250)',
					'dark=rgba(128, 0, 0, 0.250)'
				);
				validateColor(
					Ti.UI.fetchSemanticColor('magenta_0'),
					'light=rgba(255, 0, 255, 0.000)',
					'dark=rgba(128, 0, 128, 0.000)'
				);
				validateColor(
					Ti.UI.fetchSemanticColor('yellow_noalpha'),
					'light=rgba(255, 255, 0, 1.000)',
					'dark=rgba(128, 128, 0, 1.000)'
				);
				// NOTE: hex => % gives more precise value, but this will effectively become 50% under the covers
				validateColor(
					Ti.UI.fetchSemanticColor('green_hex8'),
					'light=rgba(0, 255, 0, 0.502)',
					'dark=rgba(0, 128, 0, 0.502)'
				);
			}
		});

		it.ios('#fetchSemanticColor() with system colors', function () {
			if (!isIOS13Plus) {
				this.skip();
				return;
			}
			const colors = new Map([
				[ 'darkTextColor', { light: '#000000', dark: '#000000' } ],
				[ 'labelColor', { light: '#000000', dark: '#ffffff' } ],
				[ 'linkColor', { light: '#007aff', dark: '#0984ff' } ],
				[ 'lightTextColor', { light: '#99ffffff', dark: '#99ffffff' } ],
				[ 'opaqueSeparatorColor', { light: '#c6c6c8', dark: '#38383a' } ],
				[ 'placeholderTextColor', { light: '#4d3c3c43', dark: '#4debebf5' } ],
				[ 'quaternaryLabelColor', { light: '#2e3c3c43', dark: '#2eebebf5' } ],
				[ 'quaternarySystemfillColor', { light: '#14747480', dark: '#2e767680' } ],
				[ 'secondaryLabelColor', { light: '#993c3c43', dark: '#99ebebf5' } ],
				[ 'secondarySystemBackgroundColor', { light: '#f2f2f7', dark: '#1c1c1e' } ],
				[ 'secondarySystemFillColor', { light: '#29787880', dark: '#52787880' } ],
				[ 'secondarySystemGroupedBackgroundColor', { light: '#ffffff', dark: '#1c1c1e' } ],
				[ 'separatorColor', { light: '#4a3c3c43', dark: '#99545458' } ],
				[ 'systemBackgroundColor', { light: '#ffffff', dark: '#000000' } ],
				[ 'systemBlueColor', { light: '#007aff', dark: '#0a84ff' } ],
				[ 'systemFillColor', { light: '#33787880', dark: '#5c787880' } ],
				[ 'systemGrayColor', { light: '#8e8e93', dark: '#8e8e93' } ],
				[ 'systemGray2Color', { light: '#aeaeb2', dark: '#636366' } ],
				[ 'systemGray3Color', { light: '#c7c7cc', dark: '#48484a' } ],
				[ 'systemGray4Color', { light: '#d1d1d6', dark: '#3a3a3c' } ],
				[ 'systemGray5Color', { light: '#e5e5ea', dark: '#2c2c2e' } ],
				[ 'systemGray6Color', { light: '#f2f2f7', dark: '#1c1c1e' } ],
				[ 'systemGreenColor', { light: '#34c759', dark: '#30d158' } ],
				[ 'systemGroupedBackgroundColor', { light: '#f2f2f7', dark: '#000000' } ],
				[ 'systemIndigoColor', { light: '#5856d6', dark: '#5e5ce6' } ],
				[ 'systemOrangeColor', { light: '#ff9500', dark: '#ff9f0a' } ],
				[ 'systemPinkColor', { light: '#ff2d55', dark: '#ff375f' } ],
				[ 'systemPurpleColor', { light: '#af52de', dark: '#bf5af2' } ],
				[ 'systemRedColor', { light: '#ff3b30', dark: '#ff453a' } ],
				[ 'systemTealColor', { light: '#5ac8fa', dark: '#64d2ff' } ],
				[ 'systemYellowColor', { light: '#ffcc00', dark: '#ffd60a' } ],
				[ 'tertiaryLabelColor', { light: '#4d3c3c43', dark: '#4debebf5' } ],
				[ 'tertiarySystemBackgroundColor', { light: '#ffffff', dark: '#2c2c2e' } ],
				[ 'tertiarySystemFillColor', { light: '#1f767680', dark: '#3d767680' } ],
				[ 'tertiarySystemGroupedBackgroundColor', { light: '#f2f2f7', dark: '#2c2c2e' } ],
			]);

			// systemTealColor dark and light are different in iOS 15
			// quaternaryLabelColor dark is different in iOS 15
			if (OS_VERSION_MAJOR >= 15) {
				colors.set('systemTealColor', { light: '#30b0c7', dark: '#40c8e0' });
				colors.set('quaternaryLabelColor', { light: '#2e3c3c43', dark: '#29ebebf5' });
			}

			const theme = Ti.UI.semanticColorType; // should be light or dark
			for (const [ colorName, subcolors ] of colors) {
				Ti.UI.fetchSemanticColor(colorName).toHex().toLowerCase().should.equal(subcolors[theme], colorName);
			}
		});

		it.android('#fetchSemanticColor() with Android R.color names', () => {
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
				const resourceId = Ti.UI.fetchSemanticColor(colorName);
				resourceId.should.eql(`@color/${colorName}`);
				const color = Ti.UI.Android.getColorResource(resourceId);
				color.toHex().toLowerCase().should.equal(hex, colorName);
			}
		});

		it('use semantic colors via color properties', function (finish) {
			// FIXME: Does not honour scale correctly on macOS.
			if (isCI && utilities.isMacOS()) {
				return finish();
			}

			win = Ti.UI.createWindow();
			const backgroundColor = OS_ANDROID ? 'holo_blue_bright' : 'systemredcolor';
			const suffix = OS_IOS ? `_${Ti.UI.semanticColorType}` : '';
			const view = Ti.UI.createView({
				backgroundColor,
				// NOTE: use a number divisble by 1, 2, 3 or 4 because ios scale may be one of those numbers!
				// And bug in TiBlob on iOS reports width/height in pts, not px
				width: '12px',
				height: '12px'
			});
			win.add(view);
			win.addEventListener('postlayout', function postlayout() { // FIXME: Support once!
				win.removeEventListener('postlayout', postlayout); // only run once
				try {
					should(view).matchImage(`snapshots/${backgroundColor}${suffix}.png`);
				} catch (e) {
					return finish(e);
				}
				finish();
			});
			win.open();
		});
	});

	// TODO Write tests for Ti.UI.global properties below!
	// it('backgroundColor');
	// it('backgroundImage');

	// it.ios('tintColor');
});
