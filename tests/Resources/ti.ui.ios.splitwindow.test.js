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

describe.ios('Titanium.UI.iOS', function () {
	it('#createSplitWindow()', function () {
		var splitWindow;
		should(Ti.UI.iOS.createSplitWindow).not.be.undefined();
		should(Ti.UI.iOS.createSplitWindow).be.a.Function();
		splitWindow = Ti.UI.iOS.createSplitWindow({
			masterView: Ti.UI.createWindow({
				backgroundColor: 'red'
			}),
			detailView: Ti.UI.createWindow({
				backgroundColor: 'yellow'
			})
		});
		should(splitWindow.masterView).be.an.Object();
		should(splitWindow.detailView).be.an.Object();
	});

	// Verify view controller hierarchy is set up correctly. (Used to crash in 10.0.0. See: TIMOB-28497)
	it('view controller hierarchy', function (finish) {
		this.slow(2000);
		this.timeout(5000);
		const splitWindow = Ti.UI.iOS.createSplitWindow({
			detailView: Ti.UI.createNavigationWindow({
				window: Ti.UI.createWindow({ title: 'Detail View' }),
			}),
			masterView: Ti.UI.createNavigationWindow({
				window: Ti.UI.createWindow({ title: 'Master View' }),
			}),
			showMasterInPortrait: true,
		});
		const navWindow = Ti.UI.createNavigationWindow({ window: splitWindow });
		navWindow.addEventListener('postlayout', function listener() {
			navWindow.removeEventListener('postlayout', listener);
			navWindow.close();
			finish();
		});
		navWindow.open();
	});
});

describe.ios('Titanium.UI.iOS.SplitWindow.arrangementStyle', function () {
	this.slow(2000);
	this.timeout(5000);

	function createSplitWindow(arrangementStyle) {
		return Ti.UI.iOS.createSplitWindow({
			detailView: Ti.UI.createWindow({ backgroundColor: 'yellow' }),
			masterView: Ti.UI.createWindow({ backgroundColor: 'red' }),
			arrangementStyle
		});
	}

	// The arrangement styles require iOS 27.1 and the iOS 27.1 SDK. Otherwise the default layout is used.
	// Either way the window needs to open, lay out and close.
	function openAndClose(splitWindow, finish) {
		const navWindow = Ti.UI.createNavigationWindow({ window: splitWindow });
		navWindow.addEventListener('postlayout', function listener() {
			navWindow.removeEventListener('postlayout', listener);
			navWindow.close();
			finish();
		});
		navWindow.open();
	}

	it('constants', () => {
		should(Ti.UI.iOS.SPLIT_WINDOW_ARRANGEMENT_STYLE_DEFAULT).be.eql(0);
		should(Ti.UI.iOS.SPLIT_WINDOW_ARRANGEMENT_STYLE_SPLIT).be.eql(1);
		should(Ti.UI.iOS.SPLIT_WINDOW_ARRANGEMENT_STYLE_OVERLAY).be.eql(2);
	});

	it('defaults to the default layout', () => {
		const splitWindow = createSplitWindow();
		should(splitWindow.arrangementStyle).be.undefined();
	});

	it('opens with .SPLIT', finish => {
		openAndClose(createSplitWindow(Ti.UI.iOS.SPLIT_WINDOW_ARRANGEMENT_STYLE_SPLIT), finish);
	});

	it('opens with .OVERLAY', finish => {
		openAndClose(createSplitWindow(Ti.UI.iOS.SPLIT_WINDOW_ARRANGEMENT_STYLE_OVERLAY), finish);
	});

	it('can be changed while the window is open', finish => {
		const splitWindow = createSplitWindow(Ti.UI.iOS.SPLIT_WINDOW_ARRANGEMENT_STYLE_SPLIT);
		const navWindow = Ti.UI.createNavigationWindow({ window: splitWindow });
		navWindow.addEventListener('postlayout', function listener() {
			navWindow.removeEventListener('postlayout', listener);
			try {
				splitWindow.arrangementStyle = Ti.UI.iOS.SPLIT_WINDOW_ARRANGEMENT_STYLE_OVERLAY;
				splitWindow.arrangementStyle = Ti.UI.iOS.SPLIT_WINDOW_ARRANGEMENT_STYLE_DEFAULT;
				should(splitWindow.arrangementStyle).be.eql(Ti.UI.iOS.SPLIT_WINDOW_ARRANGEMENT_STYLE_DEFAULT);
				navWindow.close();
				finish();
			} catch (err) {
				navWindow.close();
				finish(err);
			}
		});
		navWindow.open();
	});
});

// describe.ios('Titanium.UI.iOS.SplitWindow', function () {
// TODO Add tests for SplitWindow type!
// });
