/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env titanium, mocha */
/* eslint no-unused-expressions: "off" */
'use strict';

const should = require('./utilities/assertions');

describe.android('Titanium.UI.Android', () => {
	it('#createDrawerLayout', () => {
		should(Titanium.UI.Android.createDrawerLayout).be.a.Function();
		const drawerLayout = Titanium.UI.Android.createDrawerLayout();
		should(drawerLayout).be.a.Object();
	});
});

describe.android('Titanium.UI.Android.DrawerLayout', () => {
	let drawerLayout;
	afterEach(() => {
		drawerLayout = null;
	});

	describe('constants', () => {
		it('.LOCK_MODE_LOCKED_CLOSED', () => {
			should(Titanium.UI.Android.DrawerLayout).have.constant('LOCK_MODE_LOCKED_CLOSED').which.is.a.Number();
		});
		it('.LOCK_MODE_LOCKED_OPEN', () => {
			should(Titanium.UI.Android.DrawerLayout).have.constant('LOCK_MODE_LOCKED_OPEN').which.is.a.Number();
		});
		it('.LOCK_MODE_UNLOCKED', () => {
			should(Titanium.UI.Android.DrawerLayout).have.constant('LOCK_MODE_UNLOCKED').which.is.a.Number();
		});
		it('.LOCK_MODE_UNDEFINED', () => {
			should(Titanium.UI.Android.DrawerLayout).have.constant('LOCK_MODE_UNDEFINED').which.is.a.Number();
		});
	});

	describe('properties', () => {
		beforeEach(() => {
			drawerLayout = Titanium.UI.Android.createDrawerLayout();
		});

		it('.centerView', () => {
			// should(drawerLayout.centerView).be.a.Object();
			// FIXME Default value is undefined, can't verify it's supposed to be an object unless we've set a value
			should(drawerLayout.centerView).be.undefined();
		});

		it('.drawerIndicatorEnabled', () => {
			should(drawerLayout.drawerIndicatorEnabled).be.a.Boolean();
			should(drawerLayout.drawerIndicatorEnabled).be.true(); // default value
		});

		it('.drawerLockMode', () => {
			should(drawerLayout.drawerLockMode).be.a.Number();
			should(drawerLayout.drawerLockMode).eql(Titanium.UI.Android.DrawerLayout.LOCK_MODE_UNDEFINED); // default value
			// TODO Add tests that we enforce lock mode must be one of the constants defined!
		});

		it('.isLeftOpen', () => {
			should(drawerLayout.isLeftOpen).be.a.Boolean();
			should(drawerLayout.isLeftOpen).be.false(); // default value
		});

		it('.isLeftVisible', () => {
			should(drawerLayout.isLeftVisible).be.a.Boolean();
			should(drawerLayout.isLeftVisible).be.false(); // default value
		});

		it('.isRightOpen', () => {
			should(drawerLayout.isRightOpen).be.a.Boolean();
			should(drawerLayout.isRightOpen).be.false(); // default value
		});

		it('isRightVisible', () => {
			should(drawerLayout.isRightVisible).be.a.Boolean();
			should(drawerLayout.isRightVisible).be.false(); // default value
		});

		it('.leftView', () => {
			// should(drawerLayout.leftView).be.a.Object();
			// FIXME Default value is undefined, can't verify it's supposed to be an object unless we've set a value
			should(drawerLayout.leftView).be.undefined();
		});

		it('.leftWidth', () => {
			// should(drawerLayout.leftWidth).be.a.Number();
			// FIXME Default value is undefined, can't verify it's supposed to be a number unless we've opened the left drawer
			should(drawerLayout.leftWidth).be.undefined();
		});

		it('.rightView', () => {
			// should(drawerLayout.rightView).be.a.Object();
			// FIXME Default value is undefined, can't verify it's supposed to be an object unless we've set a value
			should(drawerLayout.rightView).be.undefined();
		});

		it('.rightWidth', () => {
			// should(drawerLayout.rightWidth).be.a.Number();
			// FIXME Default value is undefined, can't verify it's supposed to be a number unless we've opened the right drawer
			should(drawerLayout.rightWidth).be.undefined();
		});

		it('.toolbar', finish => {
			const window = Ti.UI.createWindow({
				theme: 'Theme.Titanium.NoTitleBar'
			});
			const toolbar = Ti.UI.createToolbar({
				titleTextColor: 'red',
				backgroundColor: 'cyan'
			});
			drawerLayout = Ti.UI.Android.createDrawerLayout({
				toolbar: toolbar
			});
			window.add(drawerLayout);
			window.addEventListener('open', () => {
				try {
					should(drawerLayout.toolbar.titleTextColor).be.a.String();
					should(drawerLayout.toolbar.titleTextColor).eql('red');
				} catch (err) {
					return finish(err);
				} finally {
					window.close();
				}
				finish();
			});
			window.open();
		});

		describe('.toolbarEnabled', () => {
			it('is a Boolean', () => {
				should(drawerLayout.toolbarEnabled).be.a.Boolean();
			});

			it('defaults to true', () => {
				should(drawerLayout.toolbarEnabled).be.true(); // default value
			});

			// Test for theme with disabled default ActionBar
			it('for Theme.Titanium.NoTitleBar', () => {
				const window = Ti.UI.createWindow({
					theme: 'Theme.Titanium.NoTitleBar'
				});
				drawerLayout = Titanium.UI.Android.createDrawerLayout();
				window.add(drawerLayout);
				should(drawerLayout.toolbarEnabled).be.true(); // default value
				drawerLayout.toolbarEnabled = false;
				should(drawerLayout.toolbarEnabled).be.false();
				drawerLayout.toolbarEnabled = true;
				should(drawerLayout.toolbarEnabled).be.true();
			});
		});
	});

	describe('events', () => {

		let drawerWindow;
		let centerView;
		let menuView;

		afterEach(() => {
			drawerWindow = null;
			centerView = null;
			menuView = null;
		});

		beforeEach(() => {
			drawerWindow = Ti.UI.createWindow();
			centerView = Ti.UI.createView();
			menuView = Ti.UI.createView({
				backgroundColor: 'red'
			});
		});

		it('check left open event', finish => {
			const drawer = Ti.UI.Android.createDrawerLayout({
				centerView: centerView,
				leftView: menuView,
			});
			drawer.addEventListener('open', function (e) {
				should(e.drawer).eql('left');
				finish();
			});
			drawerWindow.add(drawer);
			drawerWindow.open();
			drawerWindow.addEventListener('open', function () {
				setTimeout(function () {
					drawer.toggleLeft();
				}, 500);
			});
		});

		it('check right open event', finish => {
			const drawer = Ti.UI.Android.createDrawerLayout({
				centerView: centerView,
				rightView: menuView,
			});
			drawer.addEventListener('open', function (e) {
				should(e.drawer).eql('right');
				finish();
			});
			drawerWindow.add(drawer);
			drawerWindow.addEventListener('open', function () {
				setTimeout(function () {
					drawer.toggleRight();
				}, 500);
			});
			drawerWindow.open();
		});
	});
});
