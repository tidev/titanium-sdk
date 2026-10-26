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

describe.ios('Titanium.UI.iOS.SplitWindow', function () {
	this.slow(2000);
	this.timeout(5000);

	let splitWindow;

	afterEach(done => {
		if (splitWindow && !splitWindow.closed) {
			splitWindow.addEventListener('close', () => done());
			splitWindow.close();
		} else {
			done();
		}
		splitWindow = null;
	});

	function createSplitWindow(properties) {
		return Ti.UI.iOS.createSplitWindow(Object.assign({
			masterView: Ti.UI.createWindow({ title: 'Master', backgroundColor: 'red' }),
			detailView: Ti.UI.createWindow({ title: 'Detail', backgroundColor: 'yellow' })
		}, properties));
	}

	it('constants', () => {
		should(Ti.UI.iOS.SPLIT_WINDOW_DISPLAY_MODE_AUTOMATIC).be.eql(0);
		should(Ti.UI.iOS.SPLIT_WINDOW_DISPLAY_MODE_SECONDARY_ONLY).be.eql(1);
		should(Ti.UI.iOS.SPLIT_WINDOW_DISPLAY_MODE_ONE_BESIDE_SECONDARY).be.eql(2);
		should(Ti.UI.iOS.SPLIT_WINDOW_DISPLAY_MODE_ONE_OVER_SECONDARY).be.eql(3);
		should(Ti.UI.iOS.SPLIT_WINDOW_SPLIT_BEHAVIOR_AUTOMATIC).be.eql(0);
		should(Ti.UI.iOS.SPLIT_WINDOW_SPLIT_BEHAVIOR_TILE).be.eql(1);
		should(Ti.UI.iOS.SPLIT_WINDOW_SPLIT_BEHAVIOR_OVERLAY).be.eql(2);
		should(Ti.UI.iOS.SPLIT_WINDOW_SPLIT_BEHAVIOR_DISPLACE).be.eql(3);
	});

	it('.displayMode defaults to automatic', () => {
		splitWindow = createSplitWindow();
		should(splitWindow.displayMode).be.eql(Ti.UI.iOS.SPLIT_WINDOW_DISPLAY_MODE_AUTOMATIC);
	});

	it('.splitBehavior defaults to automatic', () => {
		splitWindow = createSplitWindow();
		should(splitWindow.splitBehavior).be.eql(Ti.UI.iOS.SPLIT_WINDOW_SPLIT_BEHAVIOR_AUTOMATIC);
	});

	it('#showMasterView() and #hideMasterView()', () => {
		splitWindow = createSplitWindow();
		should(splitWindow.showMasterView).be.a.Function();
		should(splitWindow.hideMasterView).be.a.Function();
	});

	it('opens and closes with Window panes', finish => {
		splitWindow = createSplitWindow({
			displayMode: Ti.UI.iOS.SPLIT_WINDOW_DISPLAY_MODE_ONE_BESIDE_SECONDARY,
			splitBehavior: Ti.UI.iOS.SPLIT_WINDOW_SPLIT_BEHAVIOR_TILE,
			presentsWithGesture: false,
			primaryColumnWidthFraction: 0.4,
			minimumPrimaryColumnWidth: 200,
			maximumPrimaryColumnWidth: 400
		});
		splitWindow.addEventListener('open', () => {
			try {
				// The system picks the mode that fits the width, so only the type is stable across devices
				should(splitWindow.displayMode).be.a.Number();
				should(splitWindow.splitBehavior).be.a.Number();
				should(splitWindow.presentsWithGesture).be.false();
				should(splitWindow.primaryColumnWidthFraction).be.eql(0.4);
				splitWindow.showMasterView();
				splitWindow.hideMasterView();
				finish();
			} catch (err) {
				finish(err);
			}
		});
		splitWindow.open();
	});

	it('opens the panes', finish => {
		const masterView = Ti.UI.createWindow({ title: 'Master' });
		const detailView = Ti.UI.createWindow({ title: 'Detail' });
		let opened = 0;
		const onOpen = () => {
			if (++opened === 2) {
				finish();
			}
		};
		masterView.addEventListener('open', onOpen);
		detailView.addEventListener('open', onOpen);
		splitWindow = Ti.UI.iOS.createSplitWindow({ masterView, detailView });
		splitWindow.open();
	});

	it('opens and closes with NavigationWindow panes', finish => {
		splitWindow = Ti.UI.iOS.createSplitWindow({
			masterView: Ti.UI.createNavigationWindow({
				window: Ti.UI.createWindow({ title: 'Master' })
			}),
			detailView: Ti.UI.createNavigationWindow({
				window: Ti.UI.createWindow({ title: 'Detail' })
			})
		});
		splitWindow.addEventListener('open', () => finish());
		splitWindow.open();
	});

	it('.masterView can be replaced twice in one tick', finish => {
		const masterA = Ti.UI.createWindow({ title: 'A' });
		const masterB = Ti.UI.createWindow({ title: 'B' });
		splitWindow = createSplitWindow({ masterView: masterA });
		splitWindow.addEventListener('open', () => {
			splitWindow.masterView = masterB;
			splitWindow.masterView = masterA;
			setTimeout(() => {
				try {
					should(splitWindow.masterView).be.eql(masterA);
					should(masterA.closed).be.false();
					should(masterB.closed).be.true();
					finish();
				} catch (err) {
					finish(err);
				}
			}, 1000);
		});
		splitWindow.open();
	});

	it('.displayMode and .splitBehavior can be changed while open', finish => {
		splitWindow = createSplitWindow();
		splitWindow.addEventListener('open', () => {
			try {
				splitWindow.displayMode = Ti.UI.iOS.SPLIT_WINDOW_DISPLAY_MODE_SECONDARY_ONLY;
				splitWindow.splitBehavior = Ti.UI.iOS.SPLIT_WINDOW_SPLIT_BEHAVIOR_OVERLAY;
				splitWindow.displayMode = Ti.UI.iOS.SPLIT_WINDOW_DISPLAY_MODE_AUTOMATIC;
				splitWindow.splitBehavior = Ti.UI.iOS.SPLIT_WINDOW_SPLIT_BEHAVIOR_AUTOMATIC;
				finish();
			} catch (err) {
				finish(err);
			}
		});
		splitWindow.open();
	});

	it('accepts the deprecated layout properties', () => {
		splitWindow = createSplitWindow({
			showMasterInPortrait: true,
			masterIsOverlayed: true,
			masterViewVisible: false,
			portraitSplit: 0.4,
			landscapeSplit: 0.3
		});
		splitWindow.setShowMasterInPortrait(false, { animated: true });
		splitWindow.setMasterIsOverlayed(false, { animated: true });
		should(splitWindow.showMasterInPortrait).be.false();
	});
});
