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

describe.windowsMissing('Titanium.UI.OptionBar', function () {
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
				const optionBar = Ti.UI.createOptionBar();
				should(optionBar).have.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.UI.OptionBar', () => {
				const optionBar = Ti.UI.createOptionBar();
				should(optionBar.apiName).be.eql('Ti.UI.OptionBar');
			});
		});

		describe('.labels', () => {
			it('from string[]', finish => {
				const optionBar = Ti.UI.createOptionBar({
					labels: [ 'A', 'B', 'C' ]
				});
				function postlayout() {
					optionBar.removeEventListener('postlayout', postlayout);
					finish();
				}
				optionBar.addEventListener('postlayout', postlayout);
				win.add(optionBar);
				win.open();
			});

			it('from BarItemType[]', finish => {
				const optionBar = Ti.UI.createOptionBar({
					labels: [
						{ title: 'A' },
						{ title: 'B' },
						{ title: 'C' }
					]
				});
				function postlayout() {
					optionBar.removeEventListener('postlayout', postlayout);
					finish();
				}
				optionBar.addEventListener('postlayout', postlayout);
				win.add(optionBar);
				win.open();
			});

			it('update', finish => {
				const optionBar = Ti.UI.createOptionBar({
					labels: [ 'A', 'B', 'C' ]
				});
				function postlayout() {
					optionBar.removeEventListener('postlayout', postlayout);
					try {
						optionBar.labels = [ 'D', 'E', 'F' ];
						should(optionBar.labels[1]).be.eql('E');
					} catch (err) {
						return finish(err);
					}
					finish();
				}
				optionBar.addEventListener('postlayout', postlayout);
				win.add(optionBar);
				win.open();
			});

			it('update - before window.open()', finish => {
				const optionBar = Ti.UI.createOptionBar();
				optionBar.labels = [ 'A', 'B', 'C' ];
				win.add(optionBar);
				win.addEventListener('open', () => {
					try {
						should(optionBar.labels[1]).be.eql('B');
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
				const optionBar = Ti.UI.createOptionBar({
					labels: [ 'A', 'B', 'C' ],
					index: 1
				});
				win.add(optionBar);
				function postlayout() {
					optionBar.removeEventListener('postlayout', postlayout);
					try {
						optionBar.index = 2;
						should(optionBar.index).eql(2);
					} catch (err) {
						return finish(err);
					}
					finish();
				}
				optionBar.addEventListener('postlayout', postlayout);
				win.open();
			});

			it('update - before window.open()', finish => {
				var optionBar = Ti.UI.createOptionBar({
					labels: [ 'A', 'B', 'C' ]
				});
				optionBar.index = 2;
				win.add(optionBar);
				win.addEventListener('open', () => {
					try {
						should(optionBar.index).be.eql(2);
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
