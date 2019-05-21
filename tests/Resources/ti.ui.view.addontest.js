/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.View', function () {

	var rootWindow,
		win;

	this.slow(2000);
	this.timeout(10000);

	before(function (finish) {
		rootWindow = Ti.UI.createWindow();
		rootWindow.addEventListener('open', function () {
			finish();
		});
		rootWindow.open();
	});

	after(function (finish) {
		rootWindow.addEventListener('close', function () {
			finish();
		});
		rootWindow.close();
	});

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	it.android('backgroundColor without color state', function (finish) {
		var view;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		view = Ti.UI.createView({ backgroundColor: '#88FFFFFF', width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.backgroundColor).be.eql('#88FFFFFF');
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it.android('backgroundColor with border', function (finish) {
		var view;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		view = Ti.UI.createView({ backgroundColor: '#88FFFFFF', borderWidth: 10, borderColor: 'green', width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.backgroundColor).be.eql('#88FFFFFF');
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it.android('backgroundColor default with color state', function (finish) {
		var view;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		view = Ti.UI.createView({ backgroundColor: '#88FFFFFF', backgroundSelectedColor: 'cyan', width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				should(view.backgroundColor).be.eql('#88FFFFFF');
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it.android('backgroundSelectedColor', function (finish) {
		var view;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				view.backgroundSelectedColor = '#88FFFFFF';
				should(view.backgroundSelectedColor).be.eql('#88FFFFFF');
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it.android('backgroundFocusedColor', function (finish) {
		var view;
		win = Ti.UI.createWindow({ backgroundColor: 'blue' });
		view = Ti.UI.createView({ width: Ti.UI.FILL, height: Ti.UI.FILL });
		win.add(view);
		win.addEventListener('focus', function () {
			try {
				view.backgroundFocusedColor = '#88FFFFFF';
				should(view.backgroundFocusedColor).be.eql('#88FFFFFF');
				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});
});
