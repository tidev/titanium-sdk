/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
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
		should(switch_ctrl.value).be.be.true();
		switch_ctrl.value = false;
		should(switch_ctrl.value).be.eql(false);
	});

	it('.value', function () {
		const switch_ctrl = Ti.UI.createSwitch();
		should(switch_ctrl.value).be.eql(false);
		switch_ctrl.value = true;
		should(switch_ctrl.value).be.be.true();
	});

});
