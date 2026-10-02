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

describe('Titanium.UI.Switch', function () {
	it.iosBroken('Ti.UI.Switch', function () { // should this be defined?
		should(Ti.UI.Switch).not.be.undefined();
	});

	it('.apiName', function () {
		const switch_ctrl = Ti.UI.createSwitch();
		should(switch_ctrl).have.readOnlyProperty('apiName').which.is.a.String();
		should(switch_ctrl.apiName).be.eql('Ti.UI.Switch');
	});

	it('createSwitch', function () {
		should(Ti.UI.createSwitch).not.be.undefined();
		should(Ti.UI.createSwitch).be.a.Function();

		// Create switch
		const switch_ctrl = Ti.UI.createSwitch({ value: true });
		should(switch_ctrl).be.a.Object();
		should(switch_ctrl.apiName).be.a.String();
		should(switch_ctrl.apiName).be.eql('Ti.UI.Switch');

		// Validate switch value
		Ti.API.info('Switch value : ' + switch_ctrl.value);
		should(switch_ctrl.value).be.true();
		switch_ctrl.value = false;
		should(switch_ctrl.value).be.false();
	});

	it('.value', function () {
		const switch_ctrl = Ti.UI.createSwitch();
		should(switch_ctrl.value).be.false();
		switch_ctrl.value = true;
		should(switch_ctrl.value).be.true();
	});

	describe.android('.style', () => {
		it('checkbox', () => {
			const switch_ctrl = Ti.UI.createSwitch({
				style: Ti.UI.SWITCH_STYLE_CHECKBOX,
				title: 'Foo',
				value: true
			});
			should(switch_ctrl.title).eql('Foo');
			switch_ctrl.title = 'Bar';
			should(switch_ctrl.title).eql('Bar');
			switch_ctrl.value = false;
			should(switch_ctrl.value).be.false();
		});

		it('chip', () => {
			const switch_ctrl = Ti.UI.createSwitch({
				style: Ti.UI.SWITCH_STYLE_CHIP,
				title: 'Foo',
				value: true
			});
			should(switch_ctrl.title).eql('Foo');
			switch_ctrl.title = 'Bar';
			should(switch_ctrl.title).eql('Bar');
			switch_ctrl.value = false;
			should(switch_ctrl.value).be.false();
		});

		it('slider', () => {
			const switch_ctrl = Ti.UI.createSwitch({
				style: Ti.UI.SWITCH_STYLE_SLIDER,
				title: 'Foo',
				value: true
			});
			should(switch_ctrl.title).eql('Foo');
			switch_ctrl.title = 'Bar';
			should(switch_ctrl.title).eql('Bar');
			switch_ctrl.value = false;
			should(switch_ctrl.value).be.false();
		});

		it('toggle button', () => {
			const switch_ctrl = Ti.UI.createSwitch({
				style: Ti.UI.SWITCH_STYLE_TOGGLE_BUTTON,
				titleOn: 'ON',
				titleOff: 'OFF',
				value: true
			});
			should(switch_ctrl.titleOn).eql('ON');
			should(switch_ctrl.titleOff).eql('OFF');
			should(switch_ctrl.value).be.true();
			switch_ctrl.value = false;
			should(switch_ctrl.value).be.false();
		});
	});
});
