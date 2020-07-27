/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env titanium, mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

const should = require('./utilities/assertions');

describe.android('Titanium.UI.Android', function () {
	it('#createDrawerLayout', function () {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function();
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object();
	});
});

describe.android('Titanium.UI.Android.DrawerLayout', function () {
	// constants
	it('.LOCK_MODE_LOCKED_CLOSED', function () {
		should(Titanium.UI.Android.DrawerLayout).have.constant('LOCK_MODE_LOCKED_CLOSED').which.is.a.Number();
	});
	it('.LOCK_MODE_LOCKED_OPEN', function () {
		should(Titanium.UI.Android.DrawerLayout).have.constant('LOCK_MODE_LOCKED_OPEN').which.is.a.Number();
	});
	it('.LOCK_MODE_UNLOCKED', function () {
		should(Titanium.UI.Android.DrawerLayout).have.constant('LOCK_MODE_UNLOCKED').which.is.a.Number();
	});
	it('.LOCK_MODE_UNDEFINED', function () {
		should(Titanium.UI.Android.DrawerLayout).have.constant('LOCK_MODE_UNDEFINED').which.is.a.Number();
	});

	// properties
	it('.isLeftOpen', function () {
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout.isLeftOpen).be.a.Boolean();
		should(drawerLayout.isLeftOpen).be.false(); // default value
	});

	it('.isRightOpen', function () {
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout.isRightOpen).be.a.Boolean();
		should(drawerLayout.isRightOpen).be.false(); // default value
	});

	it('.isLeftVisible', function () {
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout.isLeftVisible).be.a.Boolean();
		should(drawerLayout.isLeftVisible).be.false(); // default value
	});

	it('isRightVisible', function () {
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout.isRightVisible).be.a.Boolean();
		should(drawerLayout.isRightVisible).be.false(); // default value
	});

	it('.leftWidth', function () {
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		// should(drawerLayout.leftWidth).be.a.Number();
		// FIXME Default value is undefined, can't verify it's supposed to be a number unless we've opened the left drawer
		should(drawerLayout.leftWidth).be.undefined();
	});

	it('.rightWidth', function () {
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		// should(drawerLayout.rightWidth).be.a.Number();
		// FIXME Default value is undefined, can't verify it's supposed to be a number unless we've opened the right drawer
		should(drawerLayout.rightWidth).be.undefined();
	});

	it('.leftView', function () {
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		// should(drawerLayout.leftView).be.a.Object();
		// FIXME Default value is undefined, can't verify it's supposed to be an object unless we've set a value
		should(drawerLayout.leftView).be.undefined();
	});

	it('.rightView', function () {
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		// should(drawerLayout.rightView).be.a.Object();
		// FIXME Default value is undefined, can't verify it's supposed to be an object unless we've set a value
		should(drawerLayout.rightView).be.undefined();
	});

	it('.centerView', function () {
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		// should(drawerLayout.centerView).be.a.Object();
		// FIXME Default value is undefined, can't verify it's supposed to be an object unless we've set a value
		should(drawerLayout.centerView).be.undefined();
	});

	it('.drawerIndicatorEnabled', function () {
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout.drawerIndicatorEnabled).be.a.Boolean();
		should(drawerLayout.drawerIndicatorEnabled).be.true(); // default value
	});

	it('.drawerLockMode', function () {
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout.drawerLockMode).be.a.Number();
		should(drawerLayout.drawerLockMode).eql(Titanium.UI.Android.DrawerLayout.LOCK_MODE_UNDEFINED); // default value
		// TODO Add tests that we enforce lock mode must be one of the constants defined!
	});

	it('.toolbarEnabled', function () {
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout.toolbarEnabled).be.a.Boolean();
		should(drawerLayout.toolbarEnabled).be.true(); // default value
	});

	// Test for theme with disabled default ActionBar
	it.android('toolbarEnabled for Theme.AppCompat.NoTitleBar', function () {
		const window = Ti.UI.createWindow({ theme: 'Theme.AppCompat.NoTitleBar' });
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		window.add(drawerLayout);
		should(drawerLayout.toolbarEnabled).be.a.Boolean();
		should(drawerLayout.toolbarEnabled).be.true(); // default value
		drawerLayout.toolbarEnabled = false;
		should(drawerLayout.toolbarEnabled).be.a.Boolean();
		should(drawerLayout.toolbarEnabled).be.false();
		drawerLayout.toolbarEnabled = true;
		should(drawerLayout.toolbarEnabled).be.a.Boolean();
		should(drawerLayout.toolbarEnabled).be.true();
	});

	it.android('Toolbar used as toolbar', function (finish) {
		const window = Ti.UI.createWindow({ theme: 'Theme.AppCompat.NoTitleBar' });
		const toolbar = Ti.UI.createToolbar({ titleTextColor: 'red', backgroundColor: 'cyan' });
		const drawerLayout = Ti.UI.Android.createDrawerLayout({ toolbar: toolbar });
		window.add(drawerLayout);
		window.addEventListener('open', function () {
			try {
				should(drawerLayout.toolbar.getTitleTextColor()).be.a.String();
				should(drawerLayout.toolbar.getTitleTextColor()).eql('red');
			} catch (err) {
				return finish(err);
			} finally {
				window.close();
			}
			finish();
		});
		window.open();
	});

});
