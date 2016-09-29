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

	this.name = "blob";
	this.tests = [
		{name: "testBlob"},
		{name: "invalidSource"}
	]

	this.testBlob = function(testRun) {
		// TIMOB-9175 -- nativePath should be null for non-file Blobs.
		// The inverse case is tested in filesystem.js.
		valueOf(testRun, function() {
            var myBlob = Ti.createBuffer({
                value: "Use a string to build a buffer to make a blob."}).toBlob();
            valueOf(testRun, myBlob.nativePath).shouldBeNull();
        }).shouldNotThrowException();

		finish(testRun);
	}

	//TIMOB-7081
	this.invalidSource = function (testRun) {
		if (Ti.Platform.osname === 'android') {
			valueOf(testRun, function() {
				var image1 = Ti.UI.createImageView({
					image:"images/schat.png"
				});
				var blob = image1.toBlob();
				var win = Ti.UI.createWindow({backgroundColor:'white'});
				win.add(image1);
				win.open();
			}).shouldNotThrowException();
		}

		finish(testRun);
	}
}
