/*
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint promise/no-callback-in-promise: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.NavigationWindow', function () {
	this.timeout(10000);

	let nav;
	afterEach(done => {
		if (nav && !nav.closed) {
			nav.close().then(() => done()).catch(_e => done());
		} else {
			nav = null;
			done();
		}
	});

	it.iosBroken('namespace exists', () => { // should this be defined?
		should(Ti.UI.NavigationWindow).not.be.undefined();
	});

	describe('properties', () => {
		it('.apiName', () => {
			const view = Ti.UI.createNavigationWindow();
			should(view).have.readOnlyProperty('apiName').which.is.a.String();
			should(view.apiName).be.eql('Ti.UI.NavigationWindow');
		});
	});

	describe('methods', () => {
		describe('#close()', () => {
			it('is a Function', () => {
				const nav = Ti.UI.createNavigationWindow();

				should(nav).have.a.property('close').which.is.a.Function();
			});

			it('returns a Promise', finish => {
				nav = Ti.UI.createNavigationWindow({ window: Ti.UI.createWindow() });

				const openPromise = nav.open();
				openPromise.then(() => {
					const result = nav.close();
					result.should.be.a.Promise();
					return result.then(() => finish()).catch(e => finish(e)); // eslint-disable-line promise/no-nesting
				}).catch(e => finish(e));
			});

			it('called on unopened Window rejects Promise', finish => {
				nav = Ti.UI.createNavigationWindow({ window: Ti.UI.createWindow() });

				const result = nav.close();
				result.should.be.a.Promise();
				result.then(() => finish(new Error('Expected #close() to be rejected on unopened Window'))).catch(_e => finish());
			});

			it('called twice on Window rejects second Promise', finish => {
				nav = Ti.UI.createNavigationWindow({ window: Ti.UI.createWindow() });

				nav.open().then(() => {
					// eslint-disable-next-line promise/no-nesting
					return nav.close().then(() => {
						// eslint-disable-next-line promise/no-nesting
						return nav.close().then(() => finish(new Error('Expected second #close() call on Window to be rejected'))).catch(() => finish());
					}).catch(e => finish(e));
				}).catch(e => finish(e));
			});
		});

		it('#closeWindow()', () => {
			const nav = Ti.UI.createNavigationWindow();
			should(nav.closeWindow).be.a.Function();
		});

		describe('#open()', () => {
			it('is a Function', () => {
				nav = Ti.UI.createNavigationWindow();

				should(nav).have.a.property('open').which.is.a.Function();
			});

			it('returns a Promise', finish => {
				nav = Ti.UI.createNavigationWindow({ window: Ti.UI.createWindow() });

				const result = nav.open();
				result.should.be.a.Promise();
				result.then(() => finish()).catch(e => finish(e));
			});

			it('called twice on same Window rejects second Promise', finish => {
				nav = Ti.UI.createNavigationWindow({ window: Ti.UI.createWindow() });

				const first = nav.open();
				first.should.be.a.Promise();
				// eslint-disable-next-line promise/catch-or-return
				first.then(() => nav.open(), e => finish(e)).then(() => finish(new Error('Expected second #open() to be rejected')), _e => finish());
			});
		});

		describe('#openWindow()', () => {
			it('is a Function', () => {
				const view = Ti.UI.createNavigationWindow();
				should(view.openWindow).be.a.Function();
			});
		});

		// FIXME: Seems to be crashing silently on iOS?
		it('#openWindow, #closeWindow', function (finish) {
			const rootWindow = Ti.UI.createWindow();
			const subWindow = Ti.UI.createWindow();
			nav = Ti.UI.createNavigationWindow({
				window: rootWindow
			});

			rootWindow.addEventListener('open', () => {
				console.log('rootWindow open event');
				setTimeout(() => {
					try {
						nav.openWindow(subWindow);
						should(subWindow.navigationWindow).eql(nav);
					} catch (err) {
						finish(err);
					}
				}, 1);
			});

			subWindow.addEventListener('open', () => {
				console.log('subWindow open event');
				setTimeout(() => nav.closeWindow(subWindow), 1);
			});

			subWindow.addEventListener('close', () => {
				console.log('subWindow close event');
				try {
					should(subWindow.navigationWindow).not.be.ok(); // null or undefined
				} catch (err) {
					return finish(err);
				}
				finish();
			});

			nav.open();
		});

		describe('#popToRootWindow()', () => {
			it('is a Function', () => {
				const view = Ti.UI.createNavigationWindow();
				should(view.popToRootWindow).be.a.Function();
			});

			// FIXME: Crashes frequently on macOS on CI boxes
			it.macBroken('works without crashing', function (finish) {
				var rootWindow = Ti.UI.createWindow();
				var subWindow = Ti.UI.createWindow();

				nav = Ti.UI.createNavigationWindow({
					window: rootWindow
				});

				rootWindow.addEventListener('open', function open() {
					rootWindow.removeEventListener('open', open);
					setTimeout(() => nav.openWindow(subWindow), 1);
				});

				subWindow.addEventListener('close', function close () {
					subWindow.removeEventListener('close', close);
					try {
						should(subWindow.navigationWindow).not.be.ok(); // null or undefined
						// how else can we tell it got closed? I don't think a visible check is right...
						// win should not be closed!
						should(rootWindow.navigationWindow).eql(nav);
					} catch (err) {
						return finish(err);
					}
					finish();
				});

				subWindow.addEventListener('open', function open() {
					subWindow.removeEventListener('open', open);
					setTimeout(() => nav.popToRootWindow(), 1);
				});

				nav.open();
			});
		});
	});

	it('open/close should open/close the window', function (finish) {
		var window = Ti.UI.createWindow(),
			navigation = Ti.UI.createNavigationWindow({
				window: window
			});

		window.addEventListener('open', function () {
			setTimeout(function () {
				navigation.close();
			}, 1);
		});
		window.addEventListener('close', function () {
			finish();
		});
		navigation.open();
	});

	it('open/close events', finish => {
		const window = Ti.UI.createWindow();

		nav = Ti.UI.createNavigationWindow({ window });

		nav.addEventListener('open', () => nav.close());
		nav.addEventListener('close', () => finish());

		nav.open();
	});

	it('basic open/close navigation', function (finish) {
		var rootWindow = Ti.UI.createWindow(),
			window2 = Ti.UI.createWindow(),
			navigation = Ti.UI.createNavigationWindow({
				window: rootWindow
			});

		rootWindow.addEventListener('open', function () {
			setTimeout(function () {
				navigation.openWindow(window2);
			}, 1);
		});
		window2.addEventListener('open', function () {
			setTimeout(function () {
				navigation.closeWindow(window2);
			}, 1);
		});
		rootWindow.addEventListener('close', function () {
			finish();
		});
		window2.addEventListener('close', function () {
			setTimeout(function () {
				navigation.close();
			}, 1);
		});
		navigation.open();
	});

	function createTab(title) {
		const window = Ti.UI.createWindow({ title });
		return Ti.UI.createTab({
			title,
			window
		});
	}

	it('have TabGroup as a root window', done => {
		const tabGroup = Ti.UI.createTabGroup({
			title: 'TabGroup',
			tabs: [
				createTab('Tab 1'),
				createTab('Tab 2'),
				createTab('Tab 3')
			]
		});
		nav = Ti.UI.createNavigationWindow({
			window: tabGroup
		});
		nav.open().then(() => done()).catch(e => done(e));
	});

	it('have a TabGroup child in stack', function () {
		var rootWin = Ti.UI.createWindow(),
			tabGroup = Ti.UI.createTabGroup({ title: 'TabGroup',
				tabs: [ createTab('Tab 1'),
					createTab('Tab 2'),
					createTab('Tab 3') ]
			});
		nav = Ti.UI.createNavigationWindow({
			window: rootWin
		});
		nav.open();
		nav.openWindow(tabGroup);
	});
});

describe('Titanium.UI.Window', function () {
	let nav;

	this.timeout(10000);

	afterEach(done => {
		if (nav) {
			nav.close().then(() => done()).catch(() => done());
		}
		nav = null;
	});

	it.windowsMissing('.navigationWindow', function (finish) {
		const rootWindow = Ti.UI.createWindow();
		nav = Ti.UI.createNavigationWindow({
			window: rootWindow
		});

		rootWindow.addEventListener('open', function () {
			try {
				should(nav).not.be.undefined();
				should(rootWindow.navigationWindow).eql(nav);
				should(rootWindow.navigationWindow.apiName).eql('Ti.UI.NavigationWindow');
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		nav.open();
	});

	it('open window from open event of window (TIMOB-26838)', function (finish) {
		const window = Ti.UI.createWindow();
		console.log('created window, creating navigation window...');
		nav = Ti.UI.createNavigationWindow({ window	});
		console.log('created navigation window, creating next window...');

		const nextWindow = Ti.UI.createWindow();
		console.log('adding open listener to nextWindow...');
		nextWindow.addEventListener('open', () => {
			console.log('finished');
			finish();
		});
		console.log('adding open listener to first window...');
		window.addEventListener('open', () => {
			console.log('calling nav.openWindow()');
			nav.openWindow(nextWindow, { animated: true });
		});
		console.log('opening navigation window...');
		nav.open();
	});
});
