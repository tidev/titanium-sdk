/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* global OS_IOS */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

const isCI = Ti.App.Properties.getBool('isCI', false);

describe('Titanium.UI.Window', function () {
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

	it('.title', () => {
		win = Ti.UI.createWindow({
			title: 'this is some text'
		});
		should(win.title).be.a.String();
		should(win.getTitle).be.a.Function();
		should(win.title).eql('this is some text');
		should(win.getTitle()).eql('this is some text');
		win.title = 'other text';
		should(win.title).eql('other text');
		should(win.getTitle()).eql('other text');
	});

	it('.titleid', () => {
		win = Ti.UI.createWindow({
			titleid: 'this_is_my_key'
		});
		should(win.titleid).be.a.String();
		should(win.getTitleid).be.a.Function();
		should(win.titleid).eql('this_is_my_key');
		should(win.getTitleid()).eql('this_is_my_key');
		should(win.title).eql('this is my value');
		win.titleid = 'other text';
		should(win.titleid).eql('other text');
		should(win.getTitleid()).eql('other text');
		should(win.title).eql('this is my value'); // FIXME Windows: https://jira.appcelerator.org/browse/TIMOB-23498
	});

	// TODO: Why not run this on iOS? Seems to fail, though.
	// TODO: Also broken on Android, need to figure out why this test is unreliable.
	describe.allBroken('.orientationModes', () => {
		this.slow(5000);
		this.timeout(20000);

		function doOrientationModeTest(orientation, finish) {
			win = Ti.UI.createWindow({
				orientationModes: [ orientation ]
			});
			win.addEventListener('open', () => {
				setTimeout(() => {
					try {
						win.orientationModes.should.have.length(1);
						win.orientationModes[0].should.eql(orientation);
						win.orientation.should.eql(orientation);
					} catch (e) {
						return finish(e);
					}
					finish();
				}, 1000);
			});
			win.open();
		}

		it('PORTRAIT', finish => {
			doOrientationModeTest(Ti.UI.PORTRAIT, finish);
		});

		it('LANDSCAPE_LEFT', finish => {
			doOrientationModeTest(Ti.UI.LANDSCAPE_LEFT, finish);
		});

		it('LANDSCAPE_RIGHT', finish => {
			doOrientationModeTest(Ti.UI.LANDSCAPE_RIGHT, finish);
		});
	});

	it.ios('.leftNavButtons and .rightNavButtons', finish => {
		const rightButton1 = Ti.UI.createButton({
			title: 'Right1',
			color: 'green',
		});

		const rightButton2 = Ti.UI.createButton({
			title: 'Right2',
			color: 'green',
		});

		const leftButton = Ti.UI.createButton({
			title: 'Left',
			color: 'blue'
		});

		const rootWindow = Ti.UI.createWindow({
			backgroundColor: 'white',
			leftNavButtons: [ leftButton ],
			rightNavButtons: [ rightButton1, rightButton2 ],
		});

		win = Ti.UI.createNavigationWindow({
			window: rootWindow
		});

		win.open();

		rootWindow.addEventListener('focus', function focus() {
			rootWindow.removeEventListener('focus', focus);
			try {
				should(rootWindow.rightNavButtons).be.an.Array();
				should(rootWindow.rightNavButtons.length).be.eql(2);
				rootWindow.rightNavButtons = [ rightButton1 ];
				should(rootWindow.rightNavButtons.length).be.eql(1);

				should(rootWindow.leftNavButtons).be.an.Array();
				should(rootWindow.leftNavButtons.length).be.eql(1);
			} catch (e) {
				return finish(e);
			}
			finish();
		});
	});

	it.ios('.leftNavButton with default color (no color value) and .rightNavButton with tintColor', finish => {
		// TO DO: Snapshots for different iPads are different. Can not test with static image.
		// Probably try with snapshot comparision (with and without color) at run time
		if (utilities.isMacOS() || utilities.isIPad()) {
			return finish(); // how to skip for iPad?
		}

		const rightButton = Ti.UI.createButton({
			title: 'Right',
			tintColor: 'green',
		});

		const leftButton = Ti.UI.createButton({
			title: 'Left',
		});

		const rootWindow = Ti.UI.createWindow({
			backgroundColor: 'white',
			leftNavButton: leftButton,
			rightNavButton: rightButton,
		});

		win = Ti.UI.createNavigationWindow({
			height: '400px',
			width: '400px',
			window: rootWindow
		});

		win.open();

		rootWindow.addEventListener('postlayout', function postlayout() {
			rootWindow.removeEventListener('postlayout', postlayout);
			setTimeout(function () {
				try {
					should(rootWindow.leftNavButton).be.an.Object();
					should(rootWindow.rightNavButton).be.an.Object();
					should(win).matchImage('snapshots/navButton_left_defaultColor_right_greenColor.png', { maxPixelMismatch: OS_IOS ? 27 : 0 }); // iphone XR differs by 27 pixels
				} catch (e) {
					return finish(e);
				}
				finish();
			}, 10);
		});
	});

	it.ios('.leftNavButton and .rightNavButton  with color and tintColor', finish => {
		// TO DO: Snapshots for different iPads are different. Can not test with static image.
		// Probably try with snapshot comparision (with and without color) at run time
		if (utilities.isMacOS() || utilities.isIPad()) {
			return finish(); // how to skip for iPad?
		}

		const rightButton = Ti.UI.createButton({
			title: 'Right',
			tintColor: 'red',
			color: 'green', // should have preference
		});

		const leftButton = Ti.UI.createButton({
			title: 'Left',
			tintColor: 'red'
		});

		const rootWindow = Ti.UI.createWindow({
			backgroundColor: 'white',
			leftNavButton: leftButton,
			rightNavButton: rightButton,
		});

		win = Ti.UI.createNavigationWindow({
			height: '400px',
			width: '400px',
			window: rootWindow
		});

		win.open();

		rootWindow.addEventListener('postlayout', function postlayout() {
			rootWindow.removeEventListener('postlayout', postlayout);
			setTimeout(function () {
				try {
					should(rootWindow.leftNavButton).be.an.Object();
					should(rootWindow.rightNavButton).be.an.Object();
					should(win).matchImage('snapshots/navButton_left_redColor_right_greenColor.png', { maxPixelMismatch: OS_IOS ? 27 : 0 }); // iphone XR differs by 27 pixels
				} catch (e) {
					return finish(e);
				}
				finish();
			}, 10);
		});
	});

	// FIXME Move these rect/size tests into Ti.UI.View!
	it.windowsBroken('.size is read-only', finish => {
		win = Ti.UI.createWindow({
			backgroundColor: 'blue',
			width: 100,
			height: 100
		});
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);

			try {
				win.size.width.should.eql(100);
				win.size.height.should.eql(100);
				// size just returns 0 for x/y
				win.size.x.should.eql(0);
				win.size.y.should.eql(0);

				// try to change the size
				win.size.width = 120;
				win.size.height = 120;

				// shouldn't actually change
				win.size.width.should.eql(100);
				win.size.height.should.eql(100);
				win.size.x.should.eql(0);
				win.size.y.should.eql(0);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	it.androidAndWindowsBroken('.rect is read-only', finish => {
		win = Ti.UI.createWindow({
			backgroundColor: 'green',
			left: 100,
			right: 100
		});
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);

			try {
				win.rect.x.should.eql(100); // FiXME: get 0 on Android
				win.rect.y.should.eql(0);
				const width = win.rect.width;
				const height = win.rect.height;

				// try to change the rect
				win.rect.x = 120;
				win.rect.y = 5;
				win.rect.width = 10;
				win.rect.height = 5;

				// shouldn't actually change
				win.rect.x.should.eql(100);
				win.rect.y.should.eql(0);
				win.rect.width.should.eql(width);
				win.rect.height.should.eql(height);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	it('#remove(View)', function (finish) {
		this.slow(1000);
		this.timeout(20000);

		win = Ti.UI.createWindow({
			backgroundColor: 'gray'
		});
		const view = Ti.UI.createView();
		win.addEventListener('focus', function listener () {
			win.removeEventListener('focus', listener);

			try {
				should(win.children.length).be.eql(1);
				win.remove(win.children[0]);
				should(win.children.length).be.eql(0);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.add(view);
		win.open();
	});

	describe('events', function () {
		this.timeout(20000);

		// FIXME https://jira.appcelerator.org/browse/TIMOB-23640
		it.windowsDesktopBroken('postlayout event gets fired', function (finish) {
			win = Ti.UI.createWindow({ backgroundColor: 'yellow' });

			// Confirms that Ti.UI.Window fires postlayout event
			win.addEventListener('postlayout', function listener () {
				win.removeEventListener('postlayout', listener);

				finish();
			});
			win.open();
		});

		it('blur event is fired when closed', function (finish) {
			this.slow(5000);

			win = Ti.UI.createWindow({
				backgroundColor: 'pink'
			});
			win.addEventListener('blur', () => finish());
			win.addEventListener('open', function () {
				setTimeout(() => win.close(), 1);
			});
			win.open();
		});

		it('focus event is fired when opened', function (finish) {
			this.slow(2000);

			win = Ti.UI.createWindow({
				backgroundColor: 'pink'
			});
			win.addEventListener('focus', () => finish());
			win.open();
		});

		it('open event is fired', function (finish) {
			this.slow(2000);

			win = Ti.UI.createWindow({
				backgroundColor: 'pink'
			});
			win.addEventListener('open', () => finish());
			win.open();
		});

		it('close event is fired', function (finish) {
			this.slow(5000);

			win = Ti.UI.createWindow({
				backgroundColor: 'pink'
			});
			win.addEventListener('close', function listener () {
				if (win) {
					win.removeEventListener('close', listener);
				}
				finish();
			});
			win.addEventListener('open', () => win.close());
			win.open();
		});

		it('fires close event', done => {
			win = Ti.UI.createWindow({
				backgroundColor: 'pink'
			});
			win.addEventListener('open', function openListener () {
				win.removeEventListener('open', openListener);
				win.close();
			});
			win.addEventListener('close', function closeListener () {
				win.removeEventListener('close', closeListener);
				try {
					win.closed.should.be.true(); // we're being notified the window is closed, so should report closed as true!
				} catch (e) {
					return done(e);
				}
				done();
			});
			win.open();
		});
	});

	// For this test, you should see errors in the console, it is expected.
	// What you should not see is a crash
	it('should_not_crash', function (finish) {
		this.slow(5000);
		this.timeout(20000);

		const win1 = Ti.UI.createWindow();
		win1.open();
		win1.close();
		const win2 = Ti.UI.createWindow();
		win2.close();
		win1.open();
		win2.close();
		setTimeout(function () {
			win1.close();
			setTimeout(function () {
				win1.close();
				finish();
			}, 1000);
		}, 1000);
	});

	it('window_close_order_1', function (finish) {
		this.slow(5000);
		this.timeout(30000);

		win = Ti.UI.createWindow({ backgroundColor: 'green' });
		const win2 = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const win3 = Ti.UI.createWindow({ backgroundColor: 'gray' });

		function focus() {
			win.removeEventListener('focus', focus);
			win2.open();
			setTimeout(function () {
				win3.open();
				setTimeout(function () {
					win3.close();
					setTimeout(function () {
						win2.close();
						finish();
					}, 500);
				}, 500);
			}, 500);
		}
		win.addEventListener('focus', focus);

		win.open();
	});

	it('window_close_order_2', function (finish) {
		this.slow(5000);
		this.timeout(20000);

		win = Ti.UI.createWindow({ backgroundColor: 'green' });
		const win2 = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const win3 = Ti.UI.createWindow({ backgroundColor: 'gray' });

		function focus() {
			win.removeEventListener('focus', focus);
			win2.open();
			setTimeout(function () {
				win3.open();
				win2.close();
				setTimeout(function () {
					win3.close();
					finish();
				}, 500);
			}, 500);
		}

		win.addEventListener('focus', focus);

		win.open();
	});

	// TIMOB-20600
	it('TIMOB-20600', function (finish) {
		this.slow(5000);
		this.timeout(30000);

		win = Ti.UI.createWindow({ backgroundColor: 'green' });
		const win2 = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const win3 = Ti.UI.createWindow({ backgroundColor: 'gray' });

		function focus() {
			win.removeEventListener('focus', focus);
			win2.open();
			setTimeout(function () {
				win3.open();
				setTimeout(function () {
					win2.close();
					setTimeout(function () {
						win3.close();
						finish();
					}, 500);
				}, 500);
			}, 500);
		}
		win.addEventListener('focus', focus);

		win.open();
	});

	it.iosAndWindowsBroken('#toString()', () => {
		win = Ti.UI.createWindow();
		should(win.toString()).be.eql('[object Window]'); // Windows: '[object class TitaniumWindows::UI::Window]', iOS: '[object TiUIWindow]'
		should(win.apiName).be.a.String();
		should(win.apiName).be.eql('Ti.UI.Window');
	});

	it('Stringify unopened Window', () => {
		win = Ti.UI.createWindow();
		Ti.API.info(JSON.stringify(win));
	});

	it('window_navigation', function (finish) {
		this.slow(5000);
		this.timeout(30000);
		let rootWindowFocus = 0;
		let rootWindowBlur = 0;
		let rootWindowOpen = 0;
		let rootWindowClose = 0;
		let secondWindowFocus = 0;
		let secondWindowBlur = 0;
		let secondWindowOpen = 0;
		let secondWindowClose = 0;
		let thirdWindowFocus = 0;
		let thirdWindowBlur = 0;
		let thirdWindowOpen = 0;
		let thirdWindowClose = 0;

		// Create 3 windows in sucession, opening each, then once opened create.open next. Once last one is open,
		// schedule it to be closed, and as it gets closed schedule the one before it to close, etc.
		// once last window is closed, verify the number of events we get fired on each window (close/open/focus/blur)

		const rootWindow = Ti.UI.createWindow({
			backgroundColor: 'navy'
		});

		rootWindow.addEventListener('focus', () => rootWindowFocus++);
		rootWindow.addEventListener('blur', () => rootWindowBlur++);
		rootWindow.addEventListener('open', () => {
			rootWindowOpen++;

			// now move on to 2nd window!
			const secondWindow = Ti.UI.createWindow({
				backgroundColor: 'pink'
			});
			secondWindow.addEventListener('focus', () => secondWindowFocus++);
			secondWindow.addEventListener('blur', () => secondWindowBlur++);
			secondWindow.addEventListener('open', () => {
				secondWindowOpen++;

				// now move on to 3rd window
				const thirdWindow = Ti.UI.createWindow({
					backgroundColor: 'green'
				});
				thirdWindow.addEventListener('focus', () => thirdWindowFocus++);
				thirdWindow.addEventListener('blur', () => thirdWindowBlur++);
				thirdWindow.addEventListener('open', () => {
					thirdWindowOpen++;
					// now schedule it to get closed!
					setTimeout(() => thirdWindow.close(), 1);
				});
				thirdWindow.addEventListener('close', () => {
					thirdWindowClose++;
					// now close the 2nd window
					setTimeout(() => secondWindow.close(), 1);
				});
				thirdWindow.open();
			});
			secondWindow.addEventListener('close', () => {
				secondWindowClose++;
				// now close root window
				setTimeout(() => rootWindow.close(), 1);
			});
			secondWindow.open();
		});
		rootWindow.addEventListener('close', () => {
			rootWindowClose++;

			// now wrap up test!
			try {
				should(rootWindowFocus).be.eql(2);
				should(rootWindowBlur).be.eql(2); // FIXME: ios gives us 1 here!
				should(rootWindowOpen).be.eql(1);
				should(rootWindowClose).be.eql(1);

				should(secondWindowFocus).be.eql(2);
				should(secondWindowBlur).be.eql(2);
				should(secondWindowOpen).be.eql(1);
				should(secondWindowClose).be.eql(1);

				should(thirdWindowFocus).be.eql(1);
				should(thirdWindowBlur).be.eql(1);
				should(thirdWindowOpen).be.eql(1);
				should(thirdWindowClose).be.eql(1);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		rootWindow.open();
	});

	it('#applyProperties(Object)', () => {
		win = Ti.UI.createWindow();
		should.not.exist(win.custom);
		win.applyProperties({ custom: 1234 });
		should(win.custom).eql(1234);
	});

	it.ios('largeTitleEnabled', () => {
		win = Ti.UI.createWindow({
			title: 'this is some text',
			largeTitleEnabled: true
		});

		should(win.largeTitleEnabled).be.a.Boolean();
		should(win.getLargeTitleEnabled).be.a.Function();
		should(win.setLargeTitleEnabled).be.a.Function();

		should(win.largeTitleEnabled).be.true();
		should(win.getLargeTitleEnabled()).be.true();

		win.largeTitleEnabled = false;
		should(win.largeTitleEnabled).be.false();
		should(win.getLargeTitleEnabled()).be.false();

		win.setLargeTitleEnabled(true);
		should(win.largeTitleEnabled).be.true();
		should(win.getLargeTitleEnabled()).be.true();
	});

	it.ios('largeTitleDisplayMode', () => {
		win = Ti.UI.createWindow({
			title: 'this is some text',
			largeTitleDisplayMode: Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_ALWAYS
		});

		should(win.largeTitleDisplayMode).be.a.Number();
		should(win.getLargeTitleDisplayMode).be.a.Function();
		should(win.setLargeTitleDisplayMode).be.a.Function();

		should(win.largeTitleDisplayMode).eql(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_ALWAYS);
		should(win.getLargeTitleDisplayMode()).eql(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_ALWAYS);

		win.largeTitleDisplayMode = Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_AUTOMATIC;
		should(win.largeTitleDisplayMode).eql(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_AUTOMATIC);
		should(win.getLargeTitleDisplayMode()).eql(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_AUTOMATIC);

		win.setLargeTitleDisplayMode(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_NEVER);
		should(win.largeTitleDisplayMode).eql(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_NEVER);
		should(win.getLargeTitleDisplayMode()).eql(Ti.UI.iOS.LARGE_TITLE_DISPLAY_MODE_NEVER);
	});

	it.ios('.extendSafeArea', function (finish) {
		this.timeout(5000);
		// TODO: Add more unit tests related to top, bottom, left, right margins of win.safeAreaView.
		win = Ti.UI.createWindow({
			backgroundColor: 'gray',
			extendSafeArea: false
		});

		win.addEventListener('open', function () {
			try {
				should(win.safeAreaView).be.a.Object();
			} catch (e) {
				return finish(e);
			}
			finish();
		});

		win.open();
	});

	it.ios('.homeIndicatorAutoHidden', finish => {
		win = Ti.UI.createWindow({
			title: 'this is some text'
		});

		win.addEventListener('open', () => {
			try {
				should(win.homeIndicatorAutoHidden).be.a.Boolean();
				should(win.homeIndicatorAutoHidden).be.false();
				win.setHomeIndicatorAutoHidden(true);
				should(win.homeIndicatorAutoHidden).be.true();
			} catch (e) {
				return finish(e);
			}
			finish();
		});
		win.open();
	});

	it.ios('.hidesBackButton', finish => {
		if (isCI && utilities.isMacOS()) { // for whatever reaosn this fails on ci nodes, but not locally. Maybe issue with headless mac?
			return finish(); // FIXME: skip when we move to official mocha package
		}
		const window1 = Ti.UI.createWindow({
			backgroundColor: 'red'
		});

		const window2 = Ti.UI.createWindow({
			hidesBackButton: true,
			backgroundColor: 'yellow'
		});

		window1.addEventListener('focus', () => { // FIXME: On macOS CI (maybe < 10.15.6?), this event never fires! Does app need explicit focus added?
			win.openWindow(window2, { animated: false });
		});
		window2.addEventListener('open', () => {
			try {
				should(window2.hidesBackButton).be.a.Boolean();

				should(window2.getHidesBackButton).be.a.Function();
				should(window2.setHidesBackButton).be.a.Function();

				should(window2.hidesBackButton).be.true();
				should(window2.getHidesBackButton()).be.true();

				window2.hidesBackButton = false;
				should(window2.hidesBackButton).be.false();
				should(window2.getHidesBackButton()).be.false();

				window2.setHidesBackButton(true);
				should(window2.hidesBackButton).be.true();
				should(window2.getHidesBackButton()).be.true();
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win = Ti.UI.createNavigationWindow({
			window: window1
		});
		win.open({ modal: true, animated: false });
	});

	// As of Android 8.0, the OS will throw an exception if you apply a fixed orientation to a translucent window.
	// Verify that Titanium handles the issue and avoids a crash.
	it.android('TIMOB-26157', function (finish) {
		this.slow(1000);
		this.timeout(5000);

		win = Ti.UI.createWindow({
			backgroundColor: 'rgba(0,0,255,128)',
			opacity: 0.5,
			orientationModes: [ Ti.UI.PORTRAIT ]
		});
		win.addEventListener('open', () => finish());
		win.open();
	});

	it.ios('.statusBarStyle', finish => {
		win = Ti.UI.createWindow({
			title: 'This is status bar style test',
			statusBarStyle: Ti.UI.iOS.StatusBar.LIGHT_CONTENT
		});

		win.addEventListener('open', () => {
			try {
				should(win.statusBarStyle).be.a.Number();
				should(win.statusBarStyle).eql(Ti.UI.iOS.StatusBar.LIGHT_CONTENT);
				win.setStatusBarStyle(Ti.UI.iOS.StatusBar.GRAY);
				should(win.statusBarStyle).eql(Ti.UI.iOS.StatusBar.GRAY);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	it('.safeAreaPadding with extendSafeArea false', function (finish) {
		this.slow(5000);

		win = Ti.UI.createWindow({
			extendSafeArea: false,
		});
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);

			try {
				const padding = win.safeAreaPadding;
				should(padding).be.an.Object();
				should(padding.left).be.eql(0);
				should(padding.top).be.eql(0);
				should(padding.right).be.eql(0);
				should(padding.bottom).be.eql(0);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// This test will only pass on Android 4.4 and higher since older versions do not support translucent bars.
	it.android('.safeAreaPadding with extendSafeArea true', function (finish) {
		this.slow(5000);

		win = Ti.UI.createWindow({
			extendSafeArea: true,
			theme: 'Theme.Titanium.NoTitleBar',
			orientationModes: [ Ti.UI.PORTRAIT ],
			windowFlags: Ti.UI.Android.FLAG_TRANSLUCENT_STATUS | Ti.UI.Android.FLAG_TRANSLUCENT_NAVIGATION
		});
		win.addEventListener('postlayout', function listener () {
			win.removeEventListener('postlayout', listener);

			try {
				const padding = win.safeAreaPadding;
				should(padding).be.an.Object();
				should(padding.top).be.aboveOrEqual(0);
				should(padding.bottom).be.aboveOrEqual(0);
				should(padding.left).be.aboveOrEqual(0);
				should(padding.right).be.aboveOrEqual(0);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	function hasPhysicalHomeButton() {
		const model = Ti.Platform.model;
		const trimmed = model.replace(' (Simulator)', '').trim();
		const matches = trimmed.match(/(iPhone|iPad)(\d+),(\d+)/);
		if (!matches) { // regexp doesn't match. Presumably macos
			return false;
		}
		const iPhoneOriPad = matches[1];
		const majorVersion = parseInt(matches[2], 10);
		if (iPhoneOriPad === 'iPhone') {
			const minorVersion = parseInt(matches[3], 10);
			// iPhone SE 2 has a home button
			if (majorVersion === 12 && minorVersion === 8) {
				return true;
			}

			// iPhones after iPhone X have no home button
			if (majorVersion > 10) {
				return false;
			}
			// iPhones before iPhone X have home button
			if (majorVersion < 10) {
				return true;
			}
			// iPhone X has no home button (but iPhone 8 does!)
			if (minorVersion === 3 || minorVersion === 6) {
				return false;
			}
			return true; // iPhone 8 models

		} else if (iPhoneOriPad === 'iPad') {
			// iPads version 8+ have no home button, before do
			return majorVersion < 8;
		}
		return true;
	}

	it.ios('.safeAreaPadding for window inside navigation window with extendSafeArea true', finish => {
		const window = Ti.UI.createWindow({
			extendSafeArea: true,
		});
		win = Ti.UI.createNavigationWindow({
			window: window
		});
		window.addEventListener('postlayout', function listener () {
			window.removeEventListener('postlayout', listener);

			try {
				const padding = window.safeAreaPadding;
				should(padding).be.an.Object();
				// top padding should always be 0 when inside a navigation window, notch or not
				should(padding.top).be.eql(0);
				should(padding.left).be.eql(0);
				should(padding.right).be.eql(0);

				if (hasPhysicalHomeButton()) {
					should(padding.bottom).be.eql(0);
				} else {
					let bottom;
					if (utilities.isMacOS()) {
						bottom = 0;
					} else if (utilities.isIPad()) {
						// https://useyourloaf.com/blog/supporting-new-ipad-pro-models/
						// Top: 24 pts, bottom: 20 pts in Portrait *and* landscape
						bottom = 20;
						// https://stackoverflow.com/questions/46376860/what-is-the-safe-region-for-iphone-x-in-pixels-that-factors-the-top-notch-an/49174154
					} else if (Ti.Gesture.landscape) {
						// Bottom: 21 pt, left/right: 44 pt for iPhones in Landscape
						bottom = 21;
					} else {
						// Top: 44 pt, bottom: 34 pt for iPhones in Portrait
						bottom = 34;
					}
					should(padding.bottom).be.eql(bottom);
				}
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});

	// Performs an Android shared-element transition animation between 2 windows.
	// Labels from parent window will move to child window's label positions during open animation.
	it.android('#addSharedElement()', function (finish) {
		this.slow(5000);
		this.timeout(10000);

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		const sourceLabel1 = Ti.UI.createLabel({
			text: 'Transition Label 1',
			top: '10dp',
			left: '10dp'
		});
		win.add(sourceLabel1);
		const sourceLabel2 = Ti.UI.createLabel({
			text: 'Transition Label 2',
			bottom: '10dp',
			right: '10dp'
		});
		win.add(sourceLabel2);
		win.addEventListener('postlayout', function eventHandler() {
			win.removeEventListener('postlayout', eventHandler);
			const childWindow = Ti.UI.createWindow({
				backgroundColor: 'purple'
			});
			const targetLabel1 = Ti.UI.createLabel({
				text: 'Transition Label 1',
				transitionName: 'label1Transition',
				bottom: '10dp',
				left: '10dp'
			});
			childWindow.add(targetLabel1);
			childWindow.addSharedElement(sourceLabel1, targetLabel1.transitionName);
			const targetLabel2 = Ti.UI.createLabel({
				text: 'Transition Label 2',
				transitionName: 'label2Transition',
				top: '10dp',
				right: '10dp'
			});
			childWindow.add(targetLabel2);
			childWindow.addSharedElement(sourceLabel2, targetLabel2.transitionName);
			childWindow.addEventListener('open', function () {
				// Wait for transition animation to end before closing. (We don't have an event for this.)
				setTimeout(function () {
					childWindow.close();
				}, 750);
			});
			childWindow.addEventListener('close', () => finish()); // The exit animation has finished. We're done.
			childWindow.open();
		});
		win.open();
	});

	describe.android('activity transitions', function () {
		this.slow(5000);
		this.timeout(10000);

		function doTransitionTest(windowSettings, finish) {
			windowSettings.title = 'Child Window';
			windowSettings.backgroundColor = 'blue';
			win = Ti.UI.createWindow(windowSettings);
			win.addEventListener('open', function () {
				setTimeout(() => {
					win.close();
					win = null;
				}, 750);
			});
			win.addEventListener('close', () => finish());
			win.open();
		}

		it('TRANSITION_FADE_IN/TRANSITION_FADE_OUT', finish => {
			const windowSettings = {
				activityEnterTransition: Ti.UI.Android.TRANSITION_FADE_IN,
				activityReenterTransition: Ti.UI.Android.TRANSITION_FADE_IN,
				activitySharedElementEnterTransition: Ti.UI.Android.TRANSITION_NONE,
				activitySharedElementReenterTransition: Ti.UI.Android.TRANSITION_NONE,
				activityExitTransition: Ti.UI.Android.TRANSITION_FADE_OUT,
				activityReturnTransition: Ti.UI.Android.TRANSITION_FADE_OUT,
				activitySharedElementExitTransition: Ti.UI.Android.TRANSITION_NONE,
				activitySharedElementReturnTransition: Ti.UI.Android.TRANSITION_NONE
			};
			doTransitionTest(windowSettings, finish);
		});

		it('TRANSITION_SLIDE_RIGHT', finish => {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_SLIDE_RIGHT }, finish);
		});

		it('TRANSITION_SLIDE_LEFT', finish => {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_SLIDE_LEFT }, finish);
		});

		it('TRANSITION_SLIDE_TOP', finish => {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_SLIDE_TOP }, finish);
		});

		it('TRANSITION_SLIDE_BOTTOM', finish => {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_SLIDE_BOTTOM }, finish);
		});

		it('TRANSITION_EXPLODE', finish => {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_EXPLODE }, finish);
		});

		it('TRANSITION_NONE', finish => {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_NONE }, finish);
		});
	});

	it.android('.barColor with disabled ActionBar', finish => {
		win = Ti.UI.createWindow({
			barColor: 'blue',
			title: 'My Title',
			theme: 'Theme.Titanium.NoTitleBar',
		});
		win.add(Ti.UI.createLabel({ text: 'Window Title Test' }));
		win.open();
		win.addEventListener('open', () => finish());
	});

	it('TIMOB-27711 will not open if close() called immediately after', finish => {
		const win = Ti.UI.createWindow({
			backgroundColor: '#0000ff'
		});
		win.addEventListener('open', function openListener () {
			win.removeEventListener('open', openListener);
			setTimeout(() => win.close(), 1); // close it after we fail
			finish(new Error('Expected window to never open if we call open and then close immediately!'));
		});
		win.open();
		win.close();
		// wait until a window should have opened and fired the event...
		setTimeout(() => finish(), 1000);
		// locally android took 106,67,64ms
		// ios took 1ms repeatedly
		// so 1 second should be enough time.
	});

	it('.closed', done => {
		win = Ti.UI.createWindow({
			backgroundColor: '#0000ff'
		});
		win.closed.should.be.true(); // it's not yet opened, so treat as closed
		win.addEventListener('open', function openListener () {
			win.removeEventListener('open', openListener);
			try {
				win.closed.should.be.false(); // we're being notified the window is open, so should report closed as false!
			} catch (e) {
				return done(e);
			}
			done();
		});
		win.open();
		win.closed.should.be.false(); // should be open now
	});

	it('.focused', done => {
		win = Ti.UI.createWindow({
			backgroundColor: '#0000ff'
		});
		win.focused.should.be.false(); // haven't opened it yet, so shouldn't be focused
		win.addEventListener('focus', function focusListener() {
			win.removeEventListener('focus', focusListener);
			try {
				win.focused.should.be.true();
				win.close();
			} catch (e) {
				return done(e);
			}
		});
		win.addEventListener('close', function closeListener () {
			win.removeEventListener('close', closeListener);
			try {
				// we've been closed (or are closing?) so hopefully shouldn't say that we're focused
				win.focused.should.be.false();
			} catch (e) {
				return done(e);
			}
			done();
		});
		win.open();
	});	// For reference, Android fires open event and then focus event
});
