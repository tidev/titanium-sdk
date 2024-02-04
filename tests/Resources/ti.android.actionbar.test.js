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

describe.android('Titanium.Android.ActionBar', function () {
	let win;
	this.timeout(5000);

	beforeEach(() => {
		win = Ti.UI.createWindow();
	});

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

	it('.displayHomeAsUp', (finish) => {
		win = Ti.UI.createWindow();
		win.activity.onCreate = () => {
			try {
				const actionBar = win.activity.actionBar;
				actionBar.displayHomeAsUp = true;
				actionBar.homeButtonEnabled = true;
				actionBar.onHomeIconItemSelected = () => {};
				finish();
			} catch (err) {
				finish(err);
			}
		};
		win.open();
	});

	it('.homeAsUpIndicator (Image)', (finish) => {
		win = Ti.UI.createWindow();
		win.activity.onCreate = () => {
			try {
				const actionBar = win.activity.actionBar;
				actionBar.displayHomeAsUp = true;
				actionBar.homeButtonEnabled = true;
				actionBar.homeAsUpIndicator = 'SmallLogo.png';
				actionBar.onHomeIconItemSelected = () => {};
				finish();
			} catch (err) {
				finish(err);
			}
		};
		win.open();
	});

	it('.homeAsUpIndicator (Resource ID)', (finish) => {
		win = Ti.UI.createWindow();
		win.activity.onCreate = () => {
			try {
				const actionBar = win.activity.actionBar;
				actionBar.displayHomeAsUp = true;
				actionBar.homeButtonEnabled = true;
				actionBar.homeAsUpIndicator = Ti.App.Android.R.drawable.ic_baseline_close_24;
				actionBar.onHomeIconItemSelected = () => {};
				finish();
			} catch (err) {
				finish(err);
			}
		};
		win.open();
	});

	it('.icon (Image)', (finish) => {
		win = Ti.UI.createWindow();
		win.activity.onCreate = () => {
			try {
				win.activity.actionBar.icon = 'SmallLogo.png';
				finish();
			} catch (err) {
				finish(err);
			}
		};
		win.open();
	});

	it('.icon (Resource ID)', (finish) => {
		win = Ti.UI.createWindow();
		win.activity.onCreate = () => {
			try {
				win.activity.actionBar.icon = Ti.App.Android.R.drawable.ic_baseline_close_24;
				finish();
			} catch (err) {
				finish(err);
			}
		};
		win.open();
	});

	it('.logo (Image)', (finish) => {
		win = Ti.UI.createWindow();
		win.activity.onCreate = () => {
			try {
				win.activity.actionBar.logo = 'SmallLogo.png';
				finish();
			} catch (err) {
				finish(err);
			}
		};
		win.open();
	});

	it('.logo (Resource ID)', (finish) => {
		win = Ti.UI.createWindow();
		win.activity.onCreate = () => {
			try {
				win.activity.actionBar.logo = Ti.App.Android.R.drawable.ic_baseline_close_24;
				finish();
			} catch (err) {
				finish(err);
			}
		};
		win.open();
	});

	it('.visible', (finish) => {
		win = Ti.UI.createWindow();
		win.activity.onCreate = () => {
			try {
				should(win.activity.actionBar.visible).be.true();
				win.activity.actionBar.visible = false;
				should(win.activity.actionBar.visible).be.false();
				win.activity.actionBar.visible = true;
				should(win.activity.actionBar.visible).be.true();
				finish();
			} catch (err) {
				finish(err);
			}
		};
		win.open();
	});

	it('#show()/hide()', (finish) => {
		win = Ti.UI.createWindow();
		win.activity.onCreate = () => {
			try {
				should(win.activity.actionBar.visible).be.true();
				win.activity.actionBar.hide();
				should(win.activity.actionBar.visible).be.false();
				win.activity.actionBar.show();
				should(win.activity.actionBar.visible).be.true();
				finish();
			} catch (err) {
				finish(err);
			}
		};
		win.open();
	});

	it('.subtitle', (finish) => {
		win = Ti.UI.createWindow();
		win.activity.onCreate = () => {
			try {
				win.activity.actionBar.subtitle = 'My Subtitle';
				should(win.activity.actionBar.subtitle).be.eql('My Subtitle');
				finish();
			} catch (err) {
				finish(err);
			}
		};
		win.open();
	});

	it('.title', (finish) => {
		win = Ti.UI.createWindow();
		win.activity.onCreate = () => {
			try {
				win.activity.actionBar.title = 'My Title';
				should(win.activity.actionBar.title).be.eql('My Title');
				finish();
			} catch (err) {
				finish(err);
			}
		};
		win.open();
	});

	it('Theme.AppDerived.NoTitleBar', (finish) => {
		win = Ti.UI.createWindow({
			theme: 'Theme.AppDerived.NoTitleBar'
		});
		win.activity.onCreate = () => {
			try {
				should(win.activity.actionBar.visible).be.false();
				finish();
			} catch (err) {
				finish(err);
			}
		};
		win.open();
	});
});
