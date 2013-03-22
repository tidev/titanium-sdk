/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

// unfinished due to failure of base_no_pix

var isTizen = Ti.Platform.osname === 'tizen',
	isMobileWeb = Ti.Platform.osname === 'mobileweb';

(isTizen || isMobileWeb) && (Ti.include('countPixels.js'));

module.exports = new function() {
	var finish,
		valueOf,
		MIN_WINDOW_PERCENTAGE = 80,
		FULL_SCREEN_PERCENTAGE = 100,
		RED_RGB_ARRAY = [255, 0, 0],
		GREEN_RGB_ARRAY = [0, 255, 0],
		BLUE_RGB_ARRAY = [0, 0, 255],
		YELLOW_RGB_ARRAY = [255, 255, 0],
		RED_RGB = "#ff0000",
		GREEN_RGB = '#00ff00',
		BLUE_RGB = '#0000ff',
		YELLOW_RGB = '#ffff00',
		cp;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		(isTizen || isMobileWeb) && (cp = new CountPixels());
	}

	this.name = "scrollable_view";
	this.tests = [
		{name: "base"},
		{name: "pagingControlTimeout"},
		{name: "removeAddView"},
		{name: "addView"}
	]	
	
	// Helper function that creates the main window which contains scrollableView which contains three views (red, green and blue)
	// Parameters:
	// showPagingControl :Boolean - Determines whether the paging control is visible.
	// pagingControlTimeout : Number - Number of milliseconds to wait before hiding the paging control.
	// Set to less than or equal to 0 to disable timeout, to keep controls displayed.
	// openCallBack: Function - a function that is called when the window loads (postlayout)
	function TestedEnv(showPagingControl, pagingControlTimeout, openCallBack) {
    	this.mainWindow = Ti.UI.createWindow({layout:'horizontal'});

    	this.viewRed = Ti.UI.createView({ backgroundColor: RED_RGB});
    	this.viewGreen = Ti.UI.createView({ backgroundColor: GREEN_RGB});
    	this.viewBlue = Ti.UI.createView({ backgroundColor: BLUE_RGB });
			
    	this.scrollableView = Ti.UI.createScrollableView({
      		views: [this.viewRed,this.viewGreen,this.viewBlue],
      		showPagingControl: showPagingControl,
			pagingControlTimeout : pagingControlTimeout
    	});

    	this.mainWindow.add(this.scrollableView);
		
		if (openCallBack) {
			this.mainWindow.addEventListener('postlayout', openCallBack);
		}
	}
	
	// Test property currentPage and paging controll
	this.base = function(testRun) {
		// Check existing red color after loading
		// Check existing right views order
		// Set green view as currentPage
		function checkRedSet2Page() {
			valueOf(testRun, testedEnv.scrollableView.views.length).shouldBeEqual(3);
			valueOf(testRun, testedEnv.scrollableView.views[0]).shouldBeEqual(testedEnv.viewRed);
			valueOf(testRun, testedEnv.scrollableView.views[1]).shouldBeEqual(testedEnv.viewGreen);
			valueOf(testRun, testedEnv.scrollableView.views[2]).shouldBeEqual(testedEnv.viewBlue);

			cp.countPixelsPercentage(RED_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, testedEnv.scrollableView.currentPage).shouldBeEqual(0);
				valueOf(testRun, count).shouldBeEqual(FULL_SCREEN_PERCENTAGE);
				testedEnv.scrollableView.currentPage = 1;
			});
		}

		var testedEnv = new TestedEnv(false, 0, checkRedSet2Page);		
		testedEnv.mainWindow.open();
		
		// Check existing green color after calling testedEnv.scrollableView.currentPage = 1;
		// Set blue view as currentPage
		function checkGreenSet3Page() {
			cp.countPixelsPercentage(GREEN_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, testedEnv.scrollableView.currentPage).shouldBeEqual(1);
				valueOf(testRun, count).shouldBeEqual(FULL_SCREEN_PERCENTAGE);						
				testedEnv.scrollableView.currentPage = 2;
			});
		}
		
		// Use timeot because currentPage has not callback function and changing view takes some time
		setTimeout(checkGreenSet3Page, 2000);
		
		// Check existing blue color after calling testedEnv.scrollableView.currentPage = 2;
		// Set showPagingControl = true (bar paging control should appear)	
		// Set green view as currentPage
		function checkBlueSet2PagePagingControl() {
			cp.countPixelsPercentage(BLUE_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, testedEnv.scrollableView.currentPage).shouldBeEqual(2);
				valueOf(testRun, count).shouldBeEqual(FULL_SCREEN_PERCENTAGE);
				testedEnv.scrollableView.showPagingControl = true;
				testedEnv.scrollableView.currentPage = 1;
			});				
		};		

		// Use timeot because currentPage has not callback function and changing view takes some time
		setTimeout(checkBlueSet2PagePagingControl, 3000);
		
		// Check existing green color after calling testedEnv.scrollableView.currentPage = 1;
		// Set blue view as currentPage
		// Check appearance of paging control bar (green color not full creen)
		function checkPagingControlFinish() {
			cp.countPixelsPercentage(GREEN_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, testedEnv.scrollableView.currentPage).shouldBeEqual(1);
				valueOf(testRun, count).shouldBeLessThan(FULL_SCREEN_PERCENTAGE);
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WINDOW_PERCENTAGE);	
				
				finish(testRun);
				// Close window
				testedEnv.mainWindow.close();
			});			
		}

		// Use timeot because currentPage has not callback function and changing view takes some time
		setTimeout(checkPagingControlFinish, 4000);
	}
	
	// Test property pagingControlTimeout
	this.pagingControlTimeout = function(testRun) { 
		var testedEnv = new TestedEnv(
			true, 
			5000,
			function() { 
				testedEnv.scrollableView.currentPage = 1; 
			}
		);
		
		testedEnv.mainWindow.open();		
		
		// Check existing green color
		// Check appearance of paging control bar (green color not full creen)
		function checkExistPagingControl() {
			cp.countPixelsPercentage(GREEN_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, testedEnv.scrollableView.currentPage).shouldBeEqual(1);
				valueOf(testRun, count).shouldBeLessThan(FULL_SCREEN_PERCENTAGE);
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WINDOW_PERCENTAGE);	
			});			
		}

		// Use timeot because currentPage has not callback function and changing view takes some time
		setTimeout(checkExistPagingControl, 4000);

		// Check existing green color
		// Check absence of paging control bar(green color full creen) after pagingControlTimeout
		function checkNotExistPagingControlFinish() {
			cp.countPixelsPercentage(GREEN_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeEqual(FULL_SCREEN_PERCENTAGE);		
				finish(testRun);

				// Close window
				testedEnv.mainWindow.close();
			});	
		}

		// Use timeot because currentPage has not callback function and changing view takes some time
		setTimeout(checkNotExistPagingControlFinish, 6000);
	}
	
	// Test removing view and add it
	this.removeAddView = function(testRun) {
		// Check existing 3 view in scrollableView
		// Remove red view from scrollableView
		function checkViewsRmvRed() {
			valueOf(testRun, testedEnv.scrollableView.views.length).shouldBeEqual(3);
			valueOf(testRun, function() {testedEnv.scrollableView.removeView(testedEnv.viewRed)}).shouldNotThrowException();
		}

		var testedEnv = new TestedEnv(false, 10, checkViewsRmvRed);			
		testedEnv.mainWindow.open();	
	
		// Check existing 2 view in scrollableView only
		// Green view should have index 0 in currentPage
		// Check appearance of green color
		function checkGreenFinish() {
			valueOf(testRun, testedEnv.scrollableView.views.length).shouldBeEqual(2);

			cp.countPixelsPercentage(GREEN_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, testedEnv.scrollableView.currentPage).shouldBeEqual(0);
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WINDOW_PERCENTAGE);				
				valueOf(testRun, function(){testedEnv.scrollableView.addView(testedEnv.viewRed)}).shouldNotThrowException();								
			});			
		};

		// Use timeot because currentPage has not callback function and changing view takes some time
		setTimeout(checkGreenFinish, 3000);	

		// Set currentPage into red view
		// Use timeot because currentPage has not callback function and changing view takes some time
		setTimeout(function(){testedEnv.scrollableView.currentPage = 2}, 4000);	

		// Check existing 3 view in scrollableView only
		// Green view should have index 2 in currentPage
		// Check appearance of red color (added above )
		function checkRedFinish() {
			valueOf(testRun, testedEnv.scrollableView.views.length).shouldBeEqual(3);

			cp.countPixelsPercentage(RED_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, testedEnv.scrollableView.currentPage).shouldBeEqual(2);
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WINDOW_PERCENTAGE);
				
				finish(testRun);
				
				// Close window
				testedEnv.mainWindow.close();						
			});			
		};

		// Use timeot because currentPage has not callback function and changing view takes some time
		setTimeout(checkRedFinish, 6000);		
	}
	
	// Fails
	// Test adding NEW view to scrollableView
	this.addView = function(testRun) {
		// Check existing 3 view in scrollableView only
		// Add NEW yellow window into scrollableView
		// Set currentPage in new yellow window
		function checkViewsAddYellow() {
			var viewYellow = Ti.UI.createView({ 
				backgroundColor: YELLOW_RGB
			});

			valueOf(testRun, testedEnv.scrollableView.views.length).shouldBeEqual(3);
			valueOf(testRun, function(){testedEnv.scrollableView.addView(viewYellow)}).shouldNotThrowException();	
			
			// Set yellow as current page
			testedEnv.scrollableView.currentPage = 3;
		}

		var testedEnv = new TestedEnv(
			false, 
			10,
			checkViewsAddYellow
		);
		
		testedEnv.mainWindow.open();	

		// Check existing 4 view in scrollableView only
		// Check existing yellow color on screen
		// CurrentPage is #3(yellow)
		function checkYellowFinish() {
			valueOf(testRun, testedEnv.scrollableView.views.length).shouldBeEqual(4);

			cp.countPixelsPercentage(YELLOW_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, testedEnv.scrollableView.currentPage).shouldBeEqual(3);
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WINDOW_PERCENTAGE);				
				finish(testRun);
				// Close window				
				testedEnv.mainWindow.close();						
			});	
		};

		// Use timeot because currentPage has not callback function and changing view takes some time
		setTimeout(checkYellowFinish, 3000);	
	}
}