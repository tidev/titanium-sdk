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
		{name: "invalidSource"},
		{name: "blobMethods"}
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

	//TIMOB-10079
	this.blobMethods = function(testRun) {
		var image1 = Ti.UI.createImageView({
			image : '/flower.jpg'
		});
		var imageBlob = image1.toBlob();
		var cropped = imageBlob.imageAsCropped({
			x : 100,
			y : 100,
			width : 100,
			height : 200
		});
		var reSized = imageBlob.imageAsResized(200,200);
		var thumb = imageBlob.imageAsThumbnail(50,1,0 );
		var aplpha = reSized.imageWithAlpha( ) ;
		var roundCorner = reSized.imageWithRoundedCorner(25,1);
		var transparent = reSized.imageWithTransparentBorder(10);
		valueOf(testRun, cropped.height).shouldBe(200);
		valueOf(testRun, cropped.width).shouldBe(100);
		valueOf(testRun, reSized.height).shouldBe(200);
		valueOf(testRun, reSized.width).shouldBe(200);

		finish(testRun);
	}
}
