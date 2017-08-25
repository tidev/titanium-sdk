/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.UI.Android.DrawerLayout', function () {

	(utilities.isAndroid() ? it : it.skip)('isLeftOpen', function () {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function;
		var drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object;
		should(drawerLayout.isLeftOpen).be.a.Boolean;
	});

	(utilities.isAndroid() ? it : it.skip)('isRightOpen', function () {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function;
		var drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object;
		should(drawerLayout.isRightOpen).be.a.Boolean;
	});

	(utilities.isAndroid() ? it : it.skip)('isLeftVisible', function () {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function;
		var drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object;
		should(drawerLayout.isLeftVisible).be.a.Boolean;
	});

	(utilities.isAndroid() ? it : it.skip)('isRightVisible', function () {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function;
		var drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object;
		should(drawerLayout.isRightVisible).be.a.Boolean;
	});

	(utilities.isAndroid() ? it : it.skip)('leftWidth', function () {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function;
		var drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object;
		should(drawerLayout.leftWidth).be.a.Number;
	});

	(utilities.isAndroid() ? it : it.skip)('rightWidth', function () {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function;
		var drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object;
		should(drawerLayout.rightWidth).be.a.Number;
	});

	(utilities.isAndroid() ? it : it.skip)('leftView', function () {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function;
		var drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object;
		should(drawerLayout.leftView).be.a.Object;
	});

	(utilities.isAndroid() ? it : it.skip)('rightView', function () {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function;
		var drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object;
		should(drawerLayout.rightView).be.a.Object;
	});

	(utilities.isAndroid() ? it : it.skip)('centerView', function () {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function;
		var drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object;
		should(drawerLayout.centerView).be.a.Object;
	});

	(utilities.isAndroid() ? it : it.skip)('drawerIndicatorEnabled', function () {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function;
		var drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object;
		should(drawerLayout.drawerIndicatorEnabled).be.a.Boolean;
	});

	(utilities.isAndroid() ? it : it.skip)('drawerLockMode', function () {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function;
		var drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object;
		should(drawerLayout.drawerLockMode).be.a.Number;
	});

	(utilities.isAndroid() ? it : it.skip)('toolbarEnabled', function () {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function;
		var drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object;
		should(drawerLayout.toolbarEnabled).be.a.Boolean;
	});
});
