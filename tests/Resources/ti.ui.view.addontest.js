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
const utilities = require('./utilities/utilities');

const isAndroid = utilities.isAndroid();

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

	it.ios('borderRadiusCorners after opening window', function (finish) {
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		const view = Ti.UI.createView({ 
			bottom: 0, 
			height: 350,
			borderRadius: 20,
			borderRadiusCorners: [
				Ti.UI.BORDER_CORNER_TOP_RIGHT,
				Ti.UI.BORDER_CORNER_TOP_LEFT
			] 
		});
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.borderRadiusCorners).be.an.Array();
				should(view.borderRadiusCorners.length).eql(2);
			} catch (err) {
				return finish(err);
			}
			finish();
		});
		win.open();
	});
});
