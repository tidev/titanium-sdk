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

describe('Titanium.UI.TabGroup', function () {
	var tabGroup,
		tab;

	afterEach(function () {
		if (tab && tabGroup) {
			tabGroup.removeTab(tab);
		}
		tab = null;
	});

	it('add Map.View to TabGroup', function (finish) {
		this.timeout(10000);

		var win = Ti.UI.createWindow(),
			map = require('ti.map'),
			mapView = map.createView({ top: 0, height: '80%' });

		mapView.addEventListener('complete', function () {
			tabGroup.close();
			finish();
		});

		win.add(mapView);

		tabGroup = Ti.UI.createTabGroup();
		tab = Ti.UI.createTab({
			title: 'Tab',
			window: win
		});

		tabGroup.addTab(tab);
		tabGroup.open();
	});
});
