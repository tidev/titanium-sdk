/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

var isTizen = Ti.Platform.osname === 'tizen',
	isMobileWeb = Ti.Platform.osname === 'mobileweb';

(isTizen || isMobileWeb) && Ti.include('countPixels.js');

module.exports = new function() {
	var finish,
		valueOf,
		MIN_WIND_PERCENT = 50,
		MIN_PERCENT = 3,	
		RED_RGB_ARRAY = [255, 0, 0],
		GREEN_RGB_ARRAY = [0, 255, 0 ],
		YELLOW_RGB_ARRAY = [255, 255, 0],
		RED_RGB = '#ff0000',
		GREEN_RGB = '#00ff00',
		YELLOW_RGB = '#ffff00',
		BLACK_RGB = '#ffffff',
		TITLE = 'base_ui_title',
		cp = new CountPixels();

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "tab";
	this.tests = [
		{name: "base_no_pix"},
		{name: "base"},
		{name: "open"},
		{name: "open_close"},
		{name: "deactivate_tab"},
		{name: "activate_tab"},
		{name: "deactivate_activate_tab"},
		{name: "active_no_pix"},
		{name: "icon"}
	];
	
	// Helper function for creating tab group with Ti.UI.Windows as parameters
	function _createTabGroupWithWindow() {
		var tabGroup = Titanium.UI.createTabGroup(),
			i = 0,
			len = arguments.length,
			baseUITab;
	
		for (; i < len; i++) {
			baseUITab = Ti.UI.createTab({
				title: i == 0 ? TITLE : "title-" + i,
				window: arguments[i]
			});

			tabGroup.addTab(baseUITab);
		};
		
		return tabGroup;
	}
	
	// Helper function for creating tab group standard for this test
	function _createTabGroup() {	
		var redWindow = Titanium.UI.createWindow({ backgroundColor: RED_RGB}),
			greenWindow = Titanium.UI.createWindow({ backgroundColor: GREEN_RGB});

		return _createTabGroupWithWindow(redWindow,greenWindow);
	};	
	
	// Test base functionality WITHOUT pixel checking	
	this.base_no_pix = function(testRun) {
		var wind = Titanium.UI.createWindow(),
			redWin = Titanium.UI.createWindow({ backgroundColor: RED_RGB}),
			greenWin = Titanium.UI.createWindow({ backgroundColor: GREEN_RGB}),
			tabGroup =  _createTabGroupWithWindow(redWin,greenWin);
		
		wind.add(tabGroup);
		wind.open();
		
		wind.addEventListener('postlayout', function() {
			var tab = tabGroup.tabs[0];
			// Check existing first tab in TabGroup
			valueOf(testRun, tab).shouldNotBeUndefined();
			valueOf(testRun, tab instanceof Ti.UI.Tab).shouldBeTrue();
			valueOf(testRun, TITLE).shouldBeOneOf([tab.title,tab.titleid]);
			valueOf(testRun, tab.active).shouldBeTrue();
			valueOf(testRun, tab.window).shouldBeExactly(redWin);		
			
			var tab2 = tabGroup.tabs[1];

			valueOf(testRun, tab2).shouldNotBeUndefined();
			valueOf(testRun, tab2 instanceof Ti.UI.Tab).shouldBeTrue();
			valueOf(testRun, tab2.active).shouldBeFalse();	
			valueOf(testRun, tab2.window).shouldBeExactly(greenWin);	
			
			wind.close();

			finish(testRun);
		});		
	}

	// Test base functionality WITH pixel checking	
	this.base = function(testRun) {	
		var wind = Titanium.UI.createWindow(),
			tabGroup = _createTabGroup();

		wind.add(tabGroup);
		wind.open();	

		// Check that red color exists (the first tab window is red)
		wind.addEventListener('postlayout', function () {
			cp.countPixelsPercentage(RED_RGB_ARRAY, document.body,function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WIND_PERCENT);

				// Check NOT existing yellow color on the screen
				// (yellow color is used in subsequent tests)
				cp.countPixelsPercentage(YELLOW_RGB_ARRAY, document.body,function(count) {
					valueOf(testRun, count).shouldBeZero();	
					finish(testRun);

					wind.close();
				});
			});					
		});		
	}	
	
	// Test open function with pixels calculating
	this.open = function(testRun) {
		var wind = Titanium.UI.createWindow(),
			tabGroup = _createTabGroup();

		wind.add(tabGroup);
		wind.open();
		
		var firstTab = tabGroup.tabs[0],
			// Create new window
			yellowWin = Titanium.UI.createWindow({ backgroundColor: YELLOW_RGB});

		//Open new window in current tab
		valueOf(testRun, function(){firstTab.open(yellowWin)}).shouldNotThrowException();

		wind.addEventListener('postlayout', function () {			
			cp.countPixelsPercentage(RED_RGB_ARRAY, document.body,function(count) { 
				valueOf(testRun, count).shouldBeZero();

				cp.countPixelsPercentage(YELLOW_RGB_ARRAY, document.body,function(count) { 
					valueOf(testRun, count).shouldBeGreaterThan(MIN_WIND_PERCENT);
					// Close main window
					wind.close();					
					finish(testRun);						
				});
			});
		});
	}

	// Test open window in the tab and close it(with pixels calculating)
	this.open_close = function(testRun) {
		var wind = Titanium.UI.createWindow({ backgroundColor: BLACK_RGB}),
			tabGroup = _createTabGroup();

		wind.add(tabGroup);
		wind.open();

		var firstTab = tabGroup.tabs[0],
			yellowWin = Titanium.UI.createWindow({ backgroundColor: YELLOW_RGB});		

		wind.addEventListener('postlayout', function () {	
			firstTab.open(yellowWin);
		});

		setTimeout(function() {		
			// Close yellow window to the first tab
			valueOf(testRun, function(){firstTab.close(yellowWin)}).shouldNotThrowException();
		}, 1000);		

		setTimeout(function() {
			// Red window should appeare
			cp.countPixelsPercentage(RED_RGB_ARRAY, document.body, function(count) { 
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WIND_PERCENT);				
				cp.countPixelsPercentage(YELLOW_RGB_ARRAY, document.body, function(count) { 
					valueOf(testRun, count).shouldBeZero();
					finish(testRun);
					wind.close();
				});
			});
		}, 2000);
	}

	// Test setting active property(with pixels calculating)
	this.deactivate_tab = function(testRun) {
		var wind = Titanium.UI.createWindow({ backgroundColor: YELLOW_RGB}),
			tabGroup = _createTabGroup();

		wind.add(tabGroup);
		wind.open();

		var firstTab = tabGroup.tabs[0];

		wind.addEventListener('postlayout', function () {
			firstTab.active = false;	
		});			

		setTimeout(function() {
			// Red color should not appear because we set active property of first tab(with red color window) to false
			cp.countPixelsPercentage(RED_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeZero();

				// Main window background color(yellow) should appear instead of tab window color(red)
				cp.countPixelsPercentage(YELLOW_RGB_ARRAY, document.body, function(count) {
					valueOf(testRun, count).shouldBeGreaterThan(MIN_WIND_PERCENT);		
				});

				finish(testRun);
				wind.close();
			});
		}, 1000);
	}

	// Test active functionality with pixels calculating
	this.activate_tab = function(testRun) {
		var wind = Titanium.UI.createWindow(),
			tabGroup = _createTabGroup();

		wind.add(tabGroup);
		wind.open();

		var firstTab = tabGroup.tabs[0],
			secondTab = tabGroup.tabs[1];

		secondTab.active = true;

		wind.addEventListener('postlayout', function () {
			// Check if color of second tab(green) is setted on the screen
			cp.countPixelsPercentage(GREEN_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WIND_PERCENT);
				finish(testRun);
				wind.close();	
			});
		});
	}

	// Test setting active property(with pixels calculating)
	this.deactivate_activate_tab = function(testRun) {
		var wind = Titanium.UI.createWindow({ backgroundColor: YELLOW_RGB}),
			tabGroup = _createTabGroup();

		wind.add(tabGroup);
		wind.open();

		var firstTab = tabGroup.tabs[0];

		firstTab.active = false;

		setTimeout(function() {
			firstTab.active = true;
		}, 1000);

		setTimeout(function() {
			// Red color should appear because we set active property of first tab(with red color window) to true
			cp.countPixelsPercentage(RED_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WIND_PERCENT);

				finish(testRun);
				wind.close();
			});
		}, 2000);
	}
	
	// Failed - https://jira.appcelerator.org/browse/TC-1740
	this.active_no_pix = function(testRun) {
		var wind = Titanium.UI.createWindow(),
			tabGroup = _createTabGroup();

		wind.add(tabGroup);
		wind.open();
		
		var firstTab = tabGroup.tabs[0],
			secondTab = tabGroup.tabs[1];		
		
		secondTab.active = true;
		
		// Check correct values of active tab
		valueOf(testRun, firstTab.active).shouldBeFalse();
		valueOf(testRun, secondTab.active).shouldBeTrue();

		finish(testRun);
		wind.close();	
	};

	this.icon = function(testRun) {
		var wind = Titanium.UI.createWindow(),
			tabGroup = _createTabGroupWithWindow(
				Titanium.UI.createWindow({
					backgroundColor : RED_RGB
				}), 
				Titanium.UI.createWindow({
					backgroundColor : GREEN_RGB
				})
			);

		tabGroup.tabHeight = 100;

		wind.add(tabGroup);
		wind.open();

		wind.addEventListener('postlayout', function() {
			tabGroup.tabs[0].icon = "/suites/ui/image_view/yellow_blue.png";
			// Yellow color will be tested; blue will be ignored
			valueOf(testRun, tabGroup.tabs[0].icon).shouldBeEqual("/suites/ui/image_view/yellow_blue.png");
		});

		//Check appearance of the image
		//Timeout is necessary because function tab.icon doesn't have callback
		setTimeout(function(){
			cp.countPixelsPercentage(YELLOW_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(0);
				tabGroup.tabs[0].icon = null;
			});
		}, 1000);

		//Check image dissappearance
		//Timeout is necessary because function tab.icon doesn't have callback
		setTimeout(function(){
			cp.countPixelsPercentage(YELLOW_RGB_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeEqual(0);
				wind.close();
				finish(testRun);
			});
		}, 2000);
	}
}