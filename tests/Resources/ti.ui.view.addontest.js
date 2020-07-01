/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.View', function () {
	let rootWindow;
	let win;

	this.slow(2000);
	this.timeout(10000);

	before(function (finish) {
		rootWindow = Ti.UI.createWindow();
		rootWindow.addEventListener('open', () => finish());
		rootWindow.open();
	});

	after(function (finish) {
		rootWindow.addEventListener('close', () => finish());
		rootWindow.close();
	});

	afterEach(function (done) {
		if (win) {
			// If `win` is already closed, we're done.
			let t = setTimeout(function () {
				if (win) {
					win = null;
					done();
				}
			}, 3000);

			win.addEventListener('close', function listener () {
				clearTimeout(t);

				if (win) {
					win.removeEventListener('close', listener);
				}
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it.ios('borderRadius corners (string)', finish => {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({
			width: 100,
			height: 100,
			borderRadius: '20px 20 20dp 20',
		});

		win.addEventListener('focus', () => {
			try {
				should(view.borderRadius).be.a.String();
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		win.add(view);
		win.open();
	});

	it.ios('borderRadius corners (array)', finish => {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({
			width: 100,
			height: 100,
			borderRadius: [ '20px', 20, '20dp', '20' ],
		});

		win.addEventListener('focus', () => {
			try {
				should(view.borderRadius).be.an.Array();
				should(view.borderRadius.length).eql(4);
			} catch (err) {
				return finish(err);
			}
			finish();
		});

		win.add(view);
		win.open();
	});
});