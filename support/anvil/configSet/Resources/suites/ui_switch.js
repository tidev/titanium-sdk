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

	this.name = "ui_switch";
	this.tests = [
		{name: "changeEventOnLoading"}
	]

	//TIMOB-9324
	this.changeEventOnLoading = function(testRun) {
		var flag = true;
		var win = Ti.UI.createWindow();
		var simpleSwitch = Ti.UI.createSwitch({
			value : false
		});
		win.add(simpleSwitch);
		simpleSwitch.addEventListener('change', function(e) {
			flag=false;
		});
		win.open();
		valueOf(testRun, flag).shouldBeTrue();
		
		finish(testRun);
	}
}
