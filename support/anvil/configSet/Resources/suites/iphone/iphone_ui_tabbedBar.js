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
	};
	
	this.name = "ui_tabbedBar";
	
	this.tests = [
		{name: "ui_tabbedBar"}
	];
	
	//TIMOB-5171
	this.ui_tabbedBar = function(testRun) {
		var win = Ti.UI.createWindow();
		var bb1 = Titanium.UI.iOS.createTabbedBar({
			labels:['One', 'Two', 'Three'],
			backgroundColor:'blue',
			top:50,
			style:1,
			height:25,
			width:200
			});
		win.add(bb1);
		win.addEventListener("focus", function(e) {
			valueOf(testRun, bb1.size.height).shouldBe(25);
			valueOf(testRun, bb1.size.width).shouldBe(200);
			valueOf(testRun, bb1.top).shouldBe(50);
			valueOf(testRun, bb1.style).shouldBe(1);
			valueOf(testRun, bb1.backgroundColor).shouldBe('blue');
			
			finish(testRun);
		});
		win.open();
	}
}