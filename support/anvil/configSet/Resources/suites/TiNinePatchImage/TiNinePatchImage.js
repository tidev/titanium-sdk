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

 	this.name = "ui_imageview";
 	this.tests = [
 		{name: "TiNinePatchImage", timeout: 5000}
 	];

 	//12961
 	this.TiNinePatchImage = function(testRun){
 		var win = Ti.UI.createWindow();
 		var view = Ti.UI.createView({
 			height: 100,
 			width: 100,
 			backgroundImage: '/suites/ui_imageview/chat-bubble-yellow.9.png'
 		});
 		view.addEventListener('postlayout', function(){
 			valueOf(testRun, view.getHeight()).shouldBe(100);
 			valueOf(testRun, view.getHeight()).shouldBe(100);

 			finish(testRun);
 		});
 		win.add(view);
 		win.open();
 	}
 }