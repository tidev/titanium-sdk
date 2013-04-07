/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

// Simple automated tests of Ti.UI.ScrollView.
 
module.exports = new function() {
	var finish,
		valueOf,
		MIN_SCROLL_VIEW_EXISTING = 3,
		GREEN_RGB_ARRAY = [0, 255, 0],
		BLUE_RGB_ARRAY = [0, 0, 255],
		GREEN_RGB = '#00ff00',
		BLUE_RGB = '#0000ff';

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "scroll_view";
	this.tests = [
		{name: "base_no_pix", timeout: 1000}
	];
	
	// Helper functions that create Main window createScrollView and View
	function TestObjects() {
		var win = Ti.UI.createWindow({
				backgroundColor: 'white',
				exitOnClose: true,
				fullscreen: false,
				title: 'ScrollView Demo',
				height: 400,
				width: 200
			}),
			scrollView = Ti.UI.createScrollView({
				top: 0,
				left: 0,		
				backgroundColor: GREEN_RGB,
				contentWidth: 500,
				contentHeight: 200,
				showVerticalScrollIndicator: true,
				showHorizontalScrollIndicator: true,
				height: 400,
				width: 200
			}),
			view = Ti.UI.createView({
				backgroundColor: BLUE_RGB,
				top: 0,
				left: 0,
				height: 50,
				width: 200
			});

		scrollView.add(view);

		win.add(scrollView);
		
		this.mainWindow = win;
		this.scrollView = scrollView;
	}

	// Test base functionality of Ti.UI.ScrollView.
	// Fails because https://jira.appcelerator.org/browse/TC-1741
	this.base_no_pix = function(testRun) {
		var testObject = new TestObjects();
		scrollView = testObject.scrollView;	

		var wind = testObject.mainWindow;
		wind.open();

		wind.addEventListener('postlayout',  function () {
			var properties = "contentHeight, contentOffset, contentWidth, disableBounce, horizontalBounce, scrollingEnabled, showHorizontalScrollIndicator, showVerticalScrollIndicator, verticalBounce";

			properties.split(',').forEach(function(property) {
				valueOf(testRun,scrollView[property]).shouldNotBeUndefined()
			});	

			valueOf(testRun,scrollView.scrollTo).shouldBeFunction();
			valueOf(testRun,function(){scrollView.scrollTo(0,0)}).shouldNotThrowException()
				
			finish(testRun);
			wind.close();	
		});
	}
}