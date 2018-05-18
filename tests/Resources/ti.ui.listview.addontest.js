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

	it.android('listView with Ti.UI.Android.CardView', function (finish) {
		var win = Ti.UI.createWindow({
				backgroundColor: 'gray'
			}),
			listView = Ti.UI.createListView({
				templates: {
					test: {
						childTemplates: [{
							type: 'Ti.UI.Android.CardView',
							childTemplates: [{
								type: 'Ti.UI.Label',
								bindId: 'label',
								properties: {
									color: 'black',
									bindId: 'label'
								}
							}],
							properties: {
								width: Ti.UI.FILL,
								height: Ti.UI.SIZE,
								cardUseCompatPadding: true,
								backgroundColor: 'white',
								layout: 'vertical'
							}
						}]
					}
				},
				defaultItemTemplate: 'test'
			}),
			section = Ti.UI.createListSection(),
			items = [];

		['A', 'B', 'C'].forEach((item) => items.push({
			label: { text: item },
			template: 'test'
		}));

		section.setItems(items);
		listView.setSections([ section ]);

		// should not crash after drawing listView
		win.addEventListener('postlayout', function () {
			finish();
		});

		win.add(listView);
		win.open();
	});
});
