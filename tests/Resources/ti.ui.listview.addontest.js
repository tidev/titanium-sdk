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

describe('Titanium.UI.ListView', function () {
	it.windowsAndAndroidMissing('.refreshControl (in NavigationWindow)', function (finish) {
		var window, nav, control, listView;

		window = Ti.UI.createWindow({
			title: 'Hello World',
			largeTitleEnabled: true,
			extendEdges: [ Ti.UI.EXTEND_EDGE_ALL ]
		});

		window.addEventListener('open', function () {
			control.beginRefreshing();
		});

		nav = Ti.UI.iOS.createNavigationWindow({
			window: window
		});

		control = Ti.UI.createRefreshControl();

		listView = Ti.UI.createListView({
			refreshControl: control
		});

		control.addEventListener('refreshstart', function () {
			setTimeout(function () {
				control.endRefreshing();
			}, 2000);
		});

		control.addEventListener('refreshend', function () {
			finish();
		});

		window.add(listView);
		nav.open();
	});

	it.windowsMissing('.refreshControl (Basic)', function (finish) {
		var window, control, listView;

		window = Ti.UI.createWindow();

		window.addEventListener('open', function () {
			control.beginRefreshing();
		});

		control = Ti.UI.createRefreshControl();

		listView = Ti.UI.createListView({
			refreshControl: control
		});

		control.addEventListener('refreshstart', function () {
			setTimeout(function () {
				control.endRefreshing();
			}, 2000);
		});

		control.addEventListener('refreshend', function () {
			finish();
		});

		window.add(listView);
		window.open();
	});
});
