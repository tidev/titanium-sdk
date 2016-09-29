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

	this.name = "iphone_NavigationGroup";
	this.tests = [
		{name: "openEventFiresMultiple"}
	]

	//TIMOB-8346
	this.openEventFiresMultiple = function(testRun) {
		var rootWin = Ti.UI.createWindow();
		var count = 0;
		rootWin.addEventListener('open', function() {
			count++;
		});
		ng = Ti.UI.iPhone.createNavigationGroup({window:rootWin});
		var NavBase = Ti.UI.createWindow();
		NavBase.add(ng);
		NavBase.open();
		setTimeout(function() {
			valueOf(testRun, count).shouldBe(1);

			finish(testRun);
		}, 10000);
	}
}
