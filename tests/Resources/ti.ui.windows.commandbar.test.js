/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

if (utilities.isWindows()) {
	describe('Titanium.UI.Windows.CommandBar', function () {
		it('constructor', function (finish) {
			should(Ti.UI.Windows).not.be.undefined();
			should(Ti.UI.Windows.createCommandBar).be.a.Function();
			should(Ti.UI.Windows.createAppBarButton).be.a.Function();
			should(Ti.UI.Windows.createAppBarToggleButton).be.a.Function();
			should(Ti.UI.Windows.createAppBarSeparator).be.a.Function();

			finish();
		});

		it('CommandBar', function (finish) {
			var bar = Ti.UI.Windows.createCommandBar();
			should(bar).be.an.Object();
			should(bar.items).be.an.Array();
			should(bar.apiName).be.eql('Ti.UI.Windows.CommandBar');

			finish();
		});

		it('AppBarButton', function (finish) {
			var button = Ti.UI.Windows.createAppBarButton();
			should(button).be.an.Object();
			should(button.icon).not.be.undefined();
			should(button.touchEnabled).not.be.undefined();
			should(button.touchEnabled).be.a.Boolean();
			should(button.apiName).be.eql('Ti.UI.Windows.AppBarButton');

			finish();
		});

		it('AppBarToggleButton', function (finish) {
			var button = Ti.UI.Windows.createAppBarToggleButton();
			should(button).be.an.Object();
			should(button.icon).not.be.undefined();
			should(button.touchEnabled).not.be.undefined();
			should(button.checked).not.be.undefined();
			should(button.touchEnabled).be.a.Boolean();
			should(button.checked).be.a.Boolean();
			should(button.apiName).be.eql('Ti.UI.Windows.AppBarToggleButton');

			finish();
		});

		it('AppBarSeparator', function (finish) {
			var separator = Ti.UI.Windows.createAppBarSeparator();
			should(separator).be.an.Object();
			should(separator.apiName).be.a.String();
			should(separator.apiName).be.eql('Ti.UI.Windows.AppBarSeparator');

			finish();
		});
	});
}
