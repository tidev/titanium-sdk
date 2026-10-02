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

describe.windowsMissing('Titanium.UI.TabbedBar', function () {
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

	describe('properties', () => {
		describe('.apiName', () => {
			it('is a read-only String', () => {
				const tabbedBar = Ti.UI.createTabbedBar();
				should(tabbedBar).have.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.UI.TabbedBar', () => {
				const tabbedBar = Ti.UI.createTabbedBar();
				should(tabbedBar.apiName).be.eql('Ti.UI.TabbedBar');
			});
		});

		describe('.labels', () => {
			it('from string[]', finish => {
				const tabbedBar = Ti.UI.createTabbedBar({
					labels: [ 'A', 'B', 'C' ]
				});
				function postlayout() {
					tabbedBar.removeEventListener('postlayout', postlayout);
					finish();
				}
				tabbedBar.addEventListener('postlayout', postlayout);
				win.add(tabbedBar);
				win.open();
			});

			it('from BarItemType[]', finish => {
				const tabbedBar = Ti.UI.createTabbedBar({
					labels: [
						{ title: 'A' },
						{ title: 'B' },
						{ title: 'C' }
					]
				});
				function postlayout() {
					tabbedBar.removeEventListener('postlayout', postlayout);
					finish();
				}
				tabbedBar.addEventListener('postlayout', postlayout);
				win.add(tabbedBar);
				win.open();
			});

			it('update', finish => {
				const tabbedBar = Ti.UI.createTabbedBar({
					labels: [ 'A', 'B', 'C' ]
				});
				function postlayout() {
					tabbedBar.removeEventListener('postlayout', postlayout);
					try {
						tabbedBar.labels = [ 'D', 'E', 'F' ];
						should(tabbedBar.labels[1]).be.eql('E');
					} catch (err) {
						return finish(err);
					}
					finish();
				}
				tabbedBar.addEventListener('postlayout', postlayout);
				win.add(tabbedBar);
				win.open();
			});

			it('update - before window.open()', finish => {
				const tabbedBar = Ti.UI.createTabbedBar();
				tabbedBar.labels = [ 'A', 'B', 'C' ];
				win.add(tabbedBar);
				win.addEventListener('open', () => {
					try {
						should(tabbedBar.labels[1]).be.eql('B');
					} catch (err) {
						return finish(err);
					}
					finish();
				});
				win.open();
			});
		});

		describe('.index', () => {
			it('direct change', finish => {
				const tabbedBar = Ti.UI.createTabbedBar({
					labels: [ 'A', 'B', 'C' ],
					index: 1
				});
				win.add(tabbedBar);
				function postlayout() {
					tabbedBar.removeEventListener('postlayout', postlayout);
					try {
						tabbedBar.index = 2;
						should(tabbedBar.index).eql(2);
					} catch (err) {
						return finish(err);
					}
					finish();
				}
				tabbedBar.addEventListener('postlayout', postlayout);
				win.open();
			});

			it('update - before window.open()', finish => {
				var tabbedBar = Ti.UI.createTabbedBar({
					labels: [ 'A', 'B', 'C' ]
				});
				tabbedBar.index = 2;
				win.add(tabbedBar);
				win.addEventListener('open', () => {
					try {
						should(tabbedBar.index).be.eql(2);
					} catch (err) {
						return finish(err);
					}
					finish();
				});
				win.open();
			});
		});
	});
});
