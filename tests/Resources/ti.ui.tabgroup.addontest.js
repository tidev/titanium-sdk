/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti, L */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.Tabgroup', function () {

	it('Remove MapView from TabGroup', function(finish) {
		// create tab group
		var tabGroup = Titanium.UI.createTabGroup();

		var win1 = Titanium.UI.createWindow({
			title:'Tab 1',
			backgroundColor:'#fff'
		});

		var tab1 = Titanium.UI.createTab({
			title:'Tab 1',
			window:win1
		});

		var Map = require('ti.map');

		var mapview = Map.createView({top: 0, height: '80%'});

		mapview.addEventListener('complete', function() {
			tabGroup.close();
		});

		win1.add(mapview);

		tabGroup.addTab(tab1);

		tabGroup.open();

		tabGroup.addEventListener('close', function() {
			finish();
		});

	}).timeout(5000);
});