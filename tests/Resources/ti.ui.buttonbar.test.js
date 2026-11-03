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

describe.windowsMissing('Titanium.UI.ButtonBar', function () {
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
				const buttonBar = Ti.UI.createButtonBar();
				should(buttonBar).have.readOnlyProperty('apiName').which.is.a.String();
			});

			it('equals Ti.UI.ButtonBar', () => {
				const buttonBar = Ti.UI.createButtonBar();
				should(buttonBar.apiName).be.eql('Ti.UI.ButtonBar');
			});
		});

		describe('.labels', () => {
			it('from string[]', finish => {
				const buttonBar = Ti.UI.createButtonBar({
					labels: [ 'A', 'B', 'C' ]
				});
				function postlayout() {
					buttonBar.removeEventListener('postlayout', postlayout);
					finish();
				}
				buttonBar.addEventListener('postlayout', postlayout);
				win.add(buttonBar);
				win.open();
			});

			it('from BarItemType[] with titles', finish => {
				const buttonBar = Ti.UI.createButtonBar({
					labels: [
						{ title: 'A' },
						{ title: 'B' },
						{ title: 'C' }
					]
				});
				function postlayout() {
					buttonBar.removeEventListener('postlayout', postlayout);
					finish();
				}
				buttonBar.addEventListener('postlayout', postlayout);
				win.add(buttonBar);
				win.open();
			});

			it('from BarItemType[] with images', finish => {
				const buttonBar = Ti.UI.createButtonBar({
					labels: [
						{ image: '/SmallLogo.png' },
						{ image: '/SmallLogo.png' },
						{ image: '/SmallLogo.png' }
					]
				});
				function postlayout() {
					buttonBar.removeEventListener('postlayout', postlayout);
					finish();
				}
				buttonBar.addEventListener('postlayout', postlayout);
				win.add(buttonBar);
				win.open();
			});

			it('from BarItemType[] with images and titles', finish => {
				const buttonBar = Ti.UI.createButtonBar({
					labels: [
						{ title: 'A', image: '/SmallLogo.png' },
						{ title: 'B', image: '/SmallLogo.png' },
						{ title: 'C', image: '/SmallLogo.png' }
					]
				});
				function postlayout() {
					buttonBar.removeEventListener('postlayout', postlayout);
					finish();
				}
				buttonBar.addEventListener('postlayout', postlayout);
				win.add(buttonBar);
				win.open();
			});

			it('update', finish => {
				const buttonBar = Ti.UI.createButtonBar({
					labels: [ 'A', 'B', 'C' ]
				});
				function postlayout() {
					buttonBar.removeEventListener('postlayout', postlayout);
					try {
						buttonBar.labels = [ 'D', 'E', 'F' ];
						should(buttonBar.labels[1]).be.eql('E');
					} catch (err) {
						return finish(err);
					}
					finish();
				}
				buttonBar.addEventListener('postlayout', postlayout);
				win.add(buttonBar);
				win.open();
			});

			it('update - before window.open()', finish => {
				const buttonBar = Ti.UI.createButtonBar();
				buttonBar.labels = [ 'A', 'B', 'C' ];
				win.add(buttonBar);
				win.addEventListener('open', () => {
					try {
						should(buttonBar.labels[1]).be.eql('B');
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
