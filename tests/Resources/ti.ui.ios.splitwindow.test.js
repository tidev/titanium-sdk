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

// describe.ios('Titanium.UI.iOS.SplitWindow', function () {
// TODO Add tests for SplitWindow type!
// });
