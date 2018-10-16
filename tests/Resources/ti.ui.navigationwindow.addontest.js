/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-Present by Axway. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.NavigationWindow', function () {
	it.androidAndWindowsMissing('Ti.UI.NavigationWindow', function () {
		should(Ti.UI.NavigationWindow).not.be.undefined;
	});

	it.androidAndWindowsMissing('apiName', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view).have.readOnlyProperty('apiName').which.is.a.String;
		should(view.apiName).be.eql('Ti.UI.NavigationWindow');
	});

	it.androidAndWindowsMissing('#open', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view.open).not.be.undefined;
		should(view.open).be.a.Function;
	});

	it.androidAndWindowsMissing('#openWindow', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view.openWindow).not.be.undefined;
		should(view.openWindow).be.a.Function;
	});

	it.androidAndWindowsMissing('#close', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view.close).not.be.undefined;
		should(view.close).be.a.Function;
	});

	it.androidAndWindowsMissing('#closeWindow', function () {
		var view = Ti.UI.createNavigationWindow();
		should(view.closeWindow).not.be.undefined;
		should(view.closeWindow).be.a.Function;
	});

	it.androidAndWindowsMissing('open/close should open/close the window', function (finish) {
		this.timeout(5000);
		var window = Ti.UI.createWindow(),
			navigation = Ti.UI.createNavigationWindow({
				window: window
			});
		window.addEventListener('open', function () {
			setTimeout(function () {
				navigation.close();
			}, 500);
		});
		window.addEventListener('close', function () {
			setTimeout(function () {
				finish();
			}, 500);
		});
		navigation.open();
	});

	it.androidAndWindowsMissing('basic open/close navigation', function (finish) {
		this.timeout(5000);
		var window1 = Ti.UI.createWindow(),
			window2 = Ti.UI.createWindow(),
			navigation = Ti.UI.createNavigationWindow({
				window: window1
			});
		window1.addEventListener('open', function () {
			setTimeout(function () {
				navigation.openWindow(window2);
			}, 500);
		});
		window2.addEventListener('open', function () {
			setTimeout(function () {
				navigation.closeWindow(window2);
			}, 500);
		});
		window1.addEventListener('close', function () {
			setTimeout(function () {
				finish();
			}, 500);
		});
		window2.addEventListener('close', function () {
			setTimeout(function () {
				navigation.close();
			}, 500);
		});
		navigation.open();
	});
});
