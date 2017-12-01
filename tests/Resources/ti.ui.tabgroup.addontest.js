/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.Tabgroup', function () {
	var tabGroup,
		tab;

	afterEach(function () {
		if (tab && tabGroup) {
			tabGroup.removeTab(tab);
		}
		tab = null;
	});

	it('Remove MapView from TabGroup', function (finish) {
		// create tab group
		var win = Ti.UI.createWindow({
				title:'Tab 1',
				backgroundColor:'#fff'
			}),
			Map = require('ti.map'),
			mapview;

		this.timeout(10000);

		tabGroup = Ti.UI.createTabGroup();
		tab = Ti.UI.createTab({
			title:'Tab 1',
			window: win
		});

		mapview = Map.createView({ top: 0, height: '80%' });
		// when the map is done loading, close the tab group
		mapview.addEventListener('complete', function () {
			tabGroup.close();
		});

		win.add(mapview);
		tabGroup.addTab(tab);
		tabGroup.open();

		// when the tab group is closed, finish the test
		tabGroup.addEventListener('close', function () {
			finish();
		});
	});
});
