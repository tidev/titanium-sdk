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

	this.name = "runtime";
	this.tests = [
		{name: "jssErrorDialog"},
		{name: "invalidSource"}
		]

	this.jssErrorDialog = function(testRun) {
		valueOf(testRun, function() {
			var stream1 = Ti.Filesystem.openStream(Ti.Filesystem.MODE_WRITE, Ti.Filesystem.resourcesDirectory, 'stream_test_in.txt');
			var stream2 = Ti.Filesystem.openStream(Ti.Filesystem.MODE_APPEND, Ti.Filesystem.resourcesDirectory, 'stream_test_in.txt');
			var resourceFileStream = Ti.Filesystem.openStream(Ti.Filesystem.MODE_READ, Ti.Filesystem.resourcesDirectory, 'stream_test_in.txt');
			resourceFileStream.close();
		}).shouldThrowException();
		finish(testRun);
	}

	this.invalidSource= function(testRun) {
		valueOf(testRun, function() {
			var path = "images/send.png";
			var image1 = Ti.UI.createImageView({
				image:"images/schat.png"
			});
			var blob = image1.toBlob();
			var win = Ti.UI.createWindow({backgroundColor:'white'});
			win.add(image1);
			win.open();
		}).shouldNotThrowException();
		finish(testRun);
	}
}
