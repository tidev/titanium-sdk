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

	this.name = "android_kroll";
	this.tests = [
		{name: "fireSyncEvent"}
	]

	this.fireSyncEvent = function(testRun) {
		var x = {y: 0};
		Ti.App.addEventListener("custom_sync_event", function(e) {
			x.y = 1;
		});
		Ti.App.fireSyncEvent("custom_sync_event");
		valueOf(testRun, x.y).shouldBe(1);

		finish(testRun);
	}
}
