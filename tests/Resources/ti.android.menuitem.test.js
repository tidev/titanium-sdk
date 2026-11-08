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

describe.android('Titanium.Android.MenuItem', function () {
	let win;
	this.timeout(10000);

	afterEach(done => {
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

	it('queued work after removal does not crash', finish => {
		const itemId = 1001;
		let didFinish = false;
		win = Ti.UI.createWindow();
		win.activity.onCreateOptionsMenu = e => {
			if (didFinish) {
				return;
			}
			didFinish = true;
			try {
				const menu = e.menu;
				const item = menu.add({ title: 'Queued', itemId: itemId });
				should(item.apiName).eql('Ti.Android.MenuItem');
				// Each of these posts a runnable to the main thread. Removing the item in the same
				// JS turn releases it before those runnables run, so they must re-check the item.
				item.showAsAction = Ti.Android.SHOW_AS_ACTION_ALWAYS;
				item.expandActionView();
				item.collapseActionView();
				menu.removeItem(itemId);
				// Calls on a released item must be no-ops.
				item.showAsAction = Ti.Android.SHOW_AS_ACTION_NEVER;
				item.title = 'Released';
				should(item.isActionViewExpanded()).be.false();
			} catch (err) {
				return finish(err);
			}
			// Let the queued runnables run before the test completes.
			setTimeout(() => finish(), 500);
		};
		win.addEventListener('open', () => {
			win.activity.invalidateOptionsMenu();
		});
		win.open();
	});
});
