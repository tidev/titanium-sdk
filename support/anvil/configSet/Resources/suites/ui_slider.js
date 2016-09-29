/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
 
module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "ui_slider";
	this.tests = [
		{name: "sliderInTableViewRow"}
	]

	//TIMOB-9672
	this.sliderInTableViewRow = function(testRun) {
		var win1 = Titanium.UI.createWindow({backgroundColor:'#FFFFFF'});
		var ds =[];
		expandableView = Ti.UI.createView({
			top : 0,
			height : 40,
			backgroundColor : 'yellow'
		});
		var slider = Titanium.UI.createSlider({
			top : 0,
			min : 0,
			max : 100,
			value :40
		});
		expandableView.add(slider);
		var row1 = Titanium.UI.createTableViewRow({
			height : 100
		});
		row1.add(expandableView);
		ds.push(row1);
		var tableView = Titanium.UI.createTableView({
			data : ds,
			scrollable : true,
			separatorColor : 'transparent',
			separatorStyle : 'none',
			top : 0,
			height : 80
		});
		win1.add(tableView);
		win1.open();
		valueOf(testRun, slider.value).shouldBe(40);

		finish(testRun);
	}
}
