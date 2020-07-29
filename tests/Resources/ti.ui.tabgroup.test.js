/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars

describe('Titanium.UI.TabGroup', function () {
	this.timeout(5000);

	let tabGroup;
	afterEach(done => { // fires after every test in sub-suites too...
		if (tabGroup && !tabGroup.closed) {
			tabGroup.addEventListener('close', function listener () {
				tabGroup.removeEventListener('close', listener);
				tabGroup = null;
				done();
			});
			tabGroup.close();
		} else {
			tabGroup = null;
			done();
		}
	});

	it('.barColor', () => {
		tabGroup = Ti.UI.createTabGroup({
			title: 'TabGroup',
			barColor: 'red'
		});

		should(tabGroup.barColor).be.a.String();
		should(tabGroup.barColor).eql('red');
	});

	it('.tintColor', () => {
		tabGroup = Ti.UI.createTabGroup({
			title: 'TabGroup',
			tintColor: 'red'
		});

		should(tabGroup.tintColor).be.a.String();
		should(tabGroup.tintColor).eql('red');
	});

	it('.activeTintColor', () => {
		tabGroup = Ti.UI.createTabGroup({
			title: 'TabGroup',
			activeTintColor: 'red'
		});

		should(tabGroup.activeTintColor).be.a.String();
		should(tabGroup.activeTintColor).eql('red');
	});

	it.windowsBroken('add Map.View to TabGroup', function (finish) {
		this.slow(5000);
		this.timeout(15000);

		const map = require('ti.map');
		const mapView = map.createView({ top: 0, height: '80%' });
		mapView.addEventListener('complete', function listener () {
			mapView.removeEventListener('complete', listener);
			finish();
		});

		const win = Ti.UI.createWindow();
		win.add(mapView);

		tabGroup = Ti.UI.createTabGroup();
		const tab = Ti.UI.createTab({
			title: 'Tab',
			window: win
		});

		tabGroup.addTab(tab);
		tabGroup.open();
	});

	it.ios('.tabs', () => {
		const win = Ti.UI.createWindow();
		tabGroup = Ti.UI.createTabGroup();
		const tab = Ti.UI.createTab({
			title: 'Tab',
			window: win
		});

		tabGroup.addTab(tab);
		should(tabGroup.tabs.length).eql(1);
		tabGroup.removeTab(tab);
		should(tabGroup.tabs.length).eql(0);
	});

	it.ios('.allowUserCustomization', () => {
		const win = Ti.UI.createWindow();
		tabGroup = Ti.UI.createTabGroup({
			allowUserCustomization: true
		});
		const tab = Ti.UI.createTab({
			title: 'Tab',
			window: win
		});

		tabGroup.addTab(tab);
		should(tabGroup.allowUserCustomization).be.true();
		tabGroup.setAllowUserCustomization(false);
		should(tabGroup.allowUserCustomization).eql(false);
	});

	it.ios('.tabsTranslucent', () => {
		const win = Ti.UI.createWindow();
		tabGroup = Ti.UI.createTabGroup({
			tabsTranslucent: true
		});
		const tab = Ti.UI.createTab({
			title: 'Tab',
			window: win
		});

		tabGroup.addTab(tab);
		should(tabGroup.tabsTranslucent).be.true();
		tabGroup.setTabsTranslucent(false);
		should(tabGroup.tabsTranslucent).eql(false);
	});

	it.windowsBroken('#setTabs()', () => {
		const winA = Ti.UI.createWindow(),
			tabA = Ti.UI.createTab({
				title: 'Tab A',
				window: winA
			}),
			winB = Ti.UI.createWindow(),
			tabB = Ti.UI.createTab({
				title: 'Tab B',
				window: winB
			});
		tabGroup = Ti.UI.createTabGroup();

		tabGroup.setTabs([ tabA, tabB ]);
		should(tabGroup.getTabs()).eql([ tabA, tabB ]);
	});

	it.windowsBroken('#setActiveTab()', finish => {
		const winA = Ti.UI.createWindow(),
			tabA = Ti.UI.createTab({
				title: 'Tab A',
				window: winA
			}),
			winB = Ti.UI.createWindow(),
			tabB = Ti.UI.createTab({
				title: 'Tab B',
				window: winB
			});
		tabGroup = Ti.UI.createTabGroup();

		// Does windows fire this event?
		// Can we test this without even opening tab group?
		tabGroup.addEventListener('open', () => {
			try {
				tabGroup.setActiveTab(tabB);
				should(tabGroup.getActiveTab().title).be.a.String();
				should(tabGroup.getActiveTab().title).eql('Tab B');
				finish();
			} catch (err) {
				finish(err);
			} finally {
				tabGroup.removeTab(tabA);
				tabGroup.removeTab(tabB);
			}
		});

		tabGroup.addTab(tabA);
		tabGroup.addTab(tabB);
		tabGroup.open();
	});

	it.android('#disableTabNavigation()', function (finish) {
		const winA = Ti.UI.createWindow(),
			tabA = Ti.UI.createTab({
				title: 'Tab A',
				window: winA
			}),
			winB = Ti.UI.createWindow(),
			tabB = Ti.UI.createTab({
				title: 'Tab B',
				window: winB
			});
		this.timeout(5000);
		tabGroup = Ti.UI.createTabGroup();

		// does windows fire this event?
		tabGroup.addEventListener('open', () => {
			try {
				tabGroup.disableTabNavigation(true);
				tabGroup.setActiveTab(tabB);
				should(tabGroup.getActiveTab().title).be.a.String();
				should(tabGroup.getActiveTab().title).eql('Tab A');
				tabGroup.disableTabNavigation(false);
				tabGroup.setActiveTab(tabB);
				should(tabGroup.getActiveTab().title).be.a.String();
				should(tabGroup.getActiveTab().title).eql('Tab B');
			} catch (err) {
				return finish(err);
			} finally {
				tabGroup.removeTab(tabA);
				tabGroup.removeTab(tabB);
			}
			finish();
		});

		tabGroup.addTab(tabA);
		tabGroup.addTab(tabB);
		tabGroup.open();
	});

	it('.title', () => {
		tabGroup = Ti.UI.createTabGroup({
			title: 'My title'
		});

		should(tabGroup.getTitle()).be.a.String();
		should(tabGroup.getTitle()).eql('My title');
	});

	describe('events', function () {
		this.timeout(5000);

		// FIXME Windows doesn't fire open/close events
		it.windowsMissing('close', finish => {
			const win = Ti.UI.createWindow();
			tabGroup = Ti.UI.createTabGroup();
			const tab = Ti.UI.createTab({
				title: 'Tab',
				window: win
			});

			function closeTabGroup() {
				setTimeout(() => tabGroup.close(), 1);
			}

			tabGroup.addEventListener('open', closeTabGroup);
			tabGroup.addEventListener('close', function listener () {
				tabGroup.removeEventListener('open', closeTabGroup);
				tabGroup.removeEventListener('close', listener);
				finish();
			});

			tabGroup.addTab(tab);
			tabGroup.open();
		});

		// times out, presumably doesn't fire event?
		// intermittently times out on Android
		it.windowsBroken('focus', finish => {
			const win = Ti.UI.createWindow();
			tabGroup = Ti.UI.createTabGroup();
			const tab = Ti.UI.createTab({
				window: win,
				title: 'Tab'
			});

			tabGroup.addEventListener('focus', function listener () {
				tabGroup.removeEventListener('focus', listener);
				finish();
			});

			tabGroup.addTab(tab);
			tabGroup.open();
		});

		// times out, presumably doesn't fire event?
		it.windowsBroken('blur', finish => {
			const win = Ti.UI.createWindow();
			tabGroup = Ti.UI.createTabGroup();
			const tab = Ti.UI.createTab({
				title: 'Tab',
				window: win
			});

			function closeTabGroup() {
				setTimeout(() => tabGroup.close(), 1);
			}

			function done() {
				tabGroup.removeEventListener('open', closeTabGroup);
				tabGroup.removeEventListener('blur', done);
				finish();
			}

			tabGroup.addEventListener('blur', done);
			tabGroup.addEventListener('open', closeTabGroup);

			tabGroup.addTab(tab);
			tabGroup.open();
		});
	});

	it.windowsBroken('#setActiveTab()', finish => {
		const winA = Ti.UI.createWindow(),
			tabA = Ti.UI.createTab({
				title: 'Tab A',
				window: winA
			}),
			winB = Ti.UI.createWindow(),
			tabB = Ti.UI.createTab({
				title: 'Tab B',
				window: winB
			});
		tabGroup = Ti.UI.createTabGroup();

		// Does windows fire this event?
		// Can we test this without even opening tab group?
		tabGroup.addEventListener('open', () => {
			try {
				tabGroup.setActiveTab(tabB);
				should(tabGroup.getActiveTab().title).be.a.String();
				should(tabGroup.getActiveTab().title).eql('Tab B');
			} catch (err) {
				return finish(err);
			} finally {
				tabGroup.removeTab(tabA);
				tabGroup.removeTab(tabB);
			}
			finish();
		});

		tabGroup.addTab(tabA);
		tabGroup.addTab(tabB);
		tabGroup.open();
	});

	it.windowsBroken('#setActiveTab()_before_open', finish => {
		const winA = Ti.UI.createWindow(),
			tabA = Ti.UI.createTab({
				title: 'Tab A',
				window: winA
			}),
			winB = Ti.UI.createWindow(),
			tabB = Ti.UI.createTab({
				title: 'Tab B',
				window: winB
			});
		tabGroup = Ti.UI.createTabGroup();
		tabGroup.setActiveTab(1);
		// Does windows fire this event?
		// Can we test this without even opening tab group?
		tabGroup.addEventListener('open', () => {
			try {
				should(tabGroup.getActiveTab().title).be.a.String();
				should(tabGroup.getActiveTab().title).eql('Tab B');
			} catch (err) {
				return finish(err);
			} finally {
				tabGroup.removeTab(tabA);
				tabGroup.removeTab(tabB);
			}
			finish();
		});

		tabGroup.addTab(tabA);
		tabGroup.addTab(tabB);
		tabGroup.open();
	});

	it.windowsBroken('#change_activeTab_property', finish => {
		const winA = Ti.UI.createWindow(),
			tabA = Ti.UI.createTab({
				title: 'Tab A',
				window: winA
			}),
			winB = Ti.UI.createWindow(),
			tabB = Ti.UI.createTab({
				title: 'Tab B',
				window: winB
			});
		tabGroup = Ti.UI.createTabGroup();

		// Does windows fire this event?
		// Can we test this without even opening tab group?
		tabGroup.addEventListener('open', () => {
			try {
				tabGroup.activeTab = tabB;
				should(tabGroup.getActiveTab().title).be.a.String();
				should(tabGroup.getActiveTab().title).eql('Tab B');
			} catch (err) {
				return finish(err);
			} finally {
				tabGroup.removeTab(tabA);
				tabGroup.removeTab(tabB);
			}
			finish();
		});

		tabGroup.addTab(tabA);
		tabGroup.addTab(tabB);
		tabGroup.open();
	});

	it.windowsBroken('#change_activeTab_property_before_open', finish => {
		const winA = Ti.UI.createWindow(),
			tabA = Ti.UI.createTab({
				title: 'Tab A',
				window: winA
			}),
			winB = Ti.UI.createWindow(),
			tabB = Ti.UI.createTab({
				title: 'Tab B',
				window: winB
			});
		tabGroup = Ti.UI.createTabGroup();
		tabGroup.activeTab = 1;
		// Does windows fire this event?
		// Can we test this without even opening tab group?
		tabGroup.addEventListener('open', () => {
			try {
				should(tabGroup.getActiveTab().title).be.a.String();
				should(tabGroup.getActiveTab().title).eql('Tab B');
			} catch (err) {
				return finish(err);
			} finally {
				tabGroup.removeTab(tabA);
				tabGroup.removeTab(tabB);
			}
			finish();
		});

		tabGroup.addTab(tabA);
		tabGroup.addTab(tabB);
		tabGroup.open();
	});

	it.windowsBroken('#set_activeTab_in_creation_dictionary', finish => {
		const winA = Ti.UI.createWindow(),
			tabA = Ti.UI.createTab({
				title: 'Tab A',
				window: winA
			}),
			winB = Ti.UI.createWindow(),
			tabB = Ti.UI.createTab({
				title: 'Tab B',
				window: winB
			});
		tabGroup = Ti.UI.createTabGroup({
			activeTab: 1
		});
		// Does windows fire this event?
		// Can we test this without even opening tab group?
		tabGroup.addEventListener('open', () => {
			try {
				should(tabGroup.getActiveTab().title).be.a.String();
				should(tabGroup.getActiveTab().title).eql('Tab B');
			} catch (err) {
				return finish(err);
			} finally {
				tabGroup.removeTab(tabA);
				tabGroup.removeTab(tabB);
			}
			finish();
		});

		tabGroup.addTab(tabA);
		tabGroup.addTab(tabB);
		tabGroup.open();
	});

	it('title after drawing the TabGroup', () => {
		const winA = Ti.UI.createWindow(),
			winB = Ti.UI.createWindow(),
			tabA = Ti.UI.createTab({ title: 'titleA', window: winA }),
			tabB = Ti.UI.createTab({ title: 'titleB', window: winB }),
			tabGroup = Ti.UI.createTabGroup({ tabs: [ tabA, tabB ] });
		tabGroup.addEventListener('open', () => {
			tabGroup.title = 'newTitle';
			tabGroup.setActiveTab(tabB);
		});
		tabB.addEventListener('selected', () => {
			should(tabGroup.title).be.a.String();
			should(tabGroup.title).eql('newTitle');
		});
	});

	it('icon-only tabs - default style', finish => {
		this.timeout(5000);
		tabGroup = Ti.UI.createTabGroup({
			tabs: [
				Ti.UI.createTab({
					icon: '/SmallLogo.png',
					window: Ti.UI.createWindow({ title: 'Tab 1' })
				}),
				Ti.UI.createTab({
					icon: '/SmallLogo.png',
					window: Ti.UI.createWindow({ title: 'Tab 2' })
				}),
			]
		});
		tabGroup.addEventListener('open', () => finish());
		tabGroup.open();
	});

	it.android('icon-only tabs - android bottom style', finish => {
		this.timeout(5000);
		tabGroup = Ti.UI.createTabGroup({
			style: Ti.UI.Android.TABS_STYLE_BOTTOM_NAVIGATION,
			tabs: [
				Ti.UI.createTab({
					icon: '/SmallLogo.png',
					window: Ti.UI.createWindow({ title: 'Tab 1' })
				}),
				Ti.UI.createTab({
					icon: '/SmallLogo.png',
					window: Ti.UI.createWindow({ title: 'Tab 2' })
				}),
			]
		});
		tabGroup.addEventListener('open', () => finish());
		tabGroup.open();
	});

	describe('closed/focused', () => {
		beforeEach(() => {
			tabGroup = Ti.UI.createTabGroup();
			const tab = Ti.UI.createTab({
				title: 'Tab',
				window: Ti.UI.createWindow()
			});
			tabGroup.addTab(tab);
		});

		it('.closed', done => {
			tabGroup.closed.should.be.true(); // it's not yet opened, so treat as closed
			tabGroup.addEventListener('open', () => {
				try {
					tabGroup.closed.should.eql(false); // we're being notified the window is open, so should report closed as false!
				} catch (err) {
					return done(err);
				}
				done();
			});
			tabGroup.open();
			tabGroup.closed.should.eql(false); // should be open now
		});

		it('fires close event', done => {
			tabGroup.addEventListener('open', () => tabGroup.close());
			tabGroup.addEventListener('close', () => {
				try {
					tabGroup.closed.should.be.true(); // we're being notified the window is open, so should report closed as false!
				} catch (err) {
					return done(err);
				}
				done();
			});
			tabGroup.open();
		});

		it('.focused', done => {
			tabGroup.focused.should.eql(false); // haven't opened it yet, so shouldn't be focused
			// NOTE: I had to modify iOS' TabGroup implementation so that the focus event fired within the same timeline as Window's
			// The previous impl actually fired the focus event while the window was still opening, so a focus event listener
			// would have seen the TabGroup report itself as not opened or focused yet!
			tabGroup.addEventListener('focus', () => {
				try {
					tabGroup.focused.should.be.true();
					tabGroup.close();
				} catch (e) {
					return done(e);
				}
			});
			tabGroup.addEventListener('close', () => {
				try {
					// we've been closed (or are closing?) so hopefully shouldn't say that we're focused
					tabGroup.focused.should.eql(false);
				} catch (e) {
					return done(e);
				}
				done();
			});
			tabGroup.open();
		});
	});
});
