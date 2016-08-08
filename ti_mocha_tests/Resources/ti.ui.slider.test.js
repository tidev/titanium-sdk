/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe("ui_slider", function() {
	//TIMOB-9672
	it.skip("sliderInTableViewRow", function(finish) {
		var win1 = Titanium.UI.createWindow({
			backgroundColor: "#FFFFFF"
		});
		var ds = [];
		expandableView = Ti.UI.createView({
			top: 0,
			height: 40,
			backgroundColor: "yellow"
		});
		var slider = Titanium.UI.createSlider({
			top: 0,
			min: 0,
			max: 100,
			value: 40
		});
		expandableView.add(slider);
		var row1 = Titanium.UI.createTableViewRow({
			height: 100
		});
		row1.add(expandableView);
		ds.push(row1);
		var tableView = Titanium.UI.createTableView({
			data: ds,
			scrollable: true,
			separatorColor: "transparent",
			separatorStyle: "none",
			top: 0,
			height: 80
		});
		win1.add(tableView);
		win1.open();
		should(slider.value).eql(40);
		finish();
	});
});