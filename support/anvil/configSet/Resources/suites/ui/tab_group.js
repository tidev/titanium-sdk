/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */
	
var isTizen = Ti.Platform.osname === 'tizen',
	isMobileWeb = Ti.Platform.osname === 'mobileweb';

(isTizen || isMobileWeb) && (Ti.include('countPixels.js'));
 
module.exports = new function() {
	var finish,
		valueOf,
		MIN_WIND_PERCENT = 50,
		MAX_TAB_BUTTON_PERCENT = 10,
		MIN_TAB_BUTTON_PERCENT = 3,
		RED_ARRAY = [255, 0, 0],
		GREEN_ARRAY = [0, 255, 0],
		BLUE_ARRAY = [0, 0, 255],
		YELLOW_ARRAY = [255, 255, 0],	
		GREY_ARRAY = [99, 99, 99],
		RED_RGB = '#ff0000',
		GREEN_RGB = '#00ff00',
		BLUE_RGB = '#0000ff',
		YELLOW_RGB = '#ffff00',
		BLACK_RGB = '#ffffff',
		WHITE_RGB = '#000000',
		cp;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		(isTizen || isMobileWeb) && (cp = new CountPixels());
	}

	this.name = "tab_roup";
	this.tests = (function() {
		var arr = [
			{name: "base_no_pix"}
		];

		if (isTizen || isMobileWeb) {
			arr.push({name: "base"}),
			arr.push({name: "active"}),
			arr.push({name: "active_negative"}),
			arr.push({name: "color_properties"}),
			arr.push({name: "height"}),
			arr.push({name: "open"}),
			arr.push({name: "close"}),
			arr.push({name: "divide"}),
			arr.push({name: "images"}),
			arr.push({name: "tabsAtBottom"})
		}

		return arr;
	}());
	
	// Helper function for creating tab group standart for this tests
	function _createTabGroup() {
		// Create TabGroup with two tabs and assign a window of different colors to each tab
		var tabGroup = Titanium.UI.createTabGroup(),
			redWin = Titanium.UI.createWindow({ backgroundColor: RED_RGB}),
			baseUITab = Ti.UI.createTab({
				title: 'base_ui_title',
				window: redWin
			});

		tabGroup.addTab(baseUITab);
		
		var greenWin = Titanium.UI.createWindow({ backgroundColor: GREEN_RGB}),
			secondUITab = Ti.UI.createTab({
				title: 'second_ui_title',
				window: greenWin 
			});

		tabGroup.addTab(secondUITab);		
		tabGroup.setTabsBackgroundColor(WHITE_RGB);
		tabGroup.setActiveTabBackgroundColor(BLACK_RGB);
		
		return tabGroup;
	}

	// Test base functionality with pixels calculation
	this.base = function(testRun) {
		var wind = Titanium.UI.createWindow();

		wind.add(_createTabGroup());
		wind.open();
		
		// Check that the tabs really appeared, have reasonable size, and and are properly colored
		wind.addEventListener('postlayout',  function() {
			cp.countPixelsPercentage(RED_ARRAY, document.body, function(count) {		
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WIND_PERCENT);
				cp.countPixelsPercentage(GREEN_ARRAY, document.body, function(count) {
					valueOf(testRun, count).shouldBeLessThan(MIN_TAB_BUTTON_PERCENT);
					cp.countPixelsPercentage(BLUE_ARRAY, document.body, function(count) {
						valueOf(testRun, count).shouldBeLessThan(MIN_TAB_BUTTON_PERCENT);

						finish(testRun);
						wind.close();
					});	
				});					
			});
		});
	}
	
	// Test setting active window
	this.active = function(testRun) {

		//Create main window	
		var wind = Titanium.UI.createWindow(),
			tabGroup = _createTabGroup();

		//Set second tab as an active
		valueOf(testRun, function() {
			tabGroup.setActiveTab(1);
		}).shouldNotThrowException();
			
		wind.add(tabGroup);
		wind.open();			
				
		// Check that the second (green) tab (window) appeared
		wind.addEventListener('postlayout',  function() {
			cp.countPixelsPercentage(GREEN_ARRAY, document.body, function(count){
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WIND_PERCENT);
				finish(testRun);
				wind.close();
			});	
		});
						
	}
	
	// Test setting active window
	this.active_negative = function(testRun) {
		// Create main window
		var wind = Titanium.UI.createWindow(),
			tabGroup = _createTabGroup();

		valueOf(testRun,function(){tabGroup.setActiveTab(2)}).shouldNotThrowException();
		
		wind.add(tabGroup);
		wind.open();			
				
		// Check that the second (green) tab (window) appeared
		wind.addEventListener('postlayout',  function() {
			cp.countPixelsPercentage(RED_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WIND_PERCENT);
				finish(testRun);
				wind.close();
			});
		});
	}
	
	// Test base functionality without pixels calculation
	this.base_no_pix = function(testRun) {
		var wind = Titanium.UI.createWindow(),
			tabGroup = Titanium.UI.createTabGroup(),
			redWin = Titanium.UI.createWindow({ backgroundColor: RED_RGB}),
			baseUITab = Ti.UI.createTab({
				title: 'base_ui_title',
				window: redWin
			});

		tabGroup.addTab(baseUITab);
		
		var greenWin = Titanium.UI.createWindow({ backgroundColor: GREEN_RGB}),
			secondUITab = Ti.UI.createTab({
				title: 'second_ui_title',
				window: greenWin 
			});

		tabGroup.addTab(secondUITab);
		wind.add(tabGroup);
		wind.open();
		
		wind.addEventListener('postlayout',  function () {
			valueOf(testRun, tabGroup.tabs).shouldBeArray();
			valueOf(testRun, tabGroup.tabs.length).shouldBeEqual(2);
			valueOf(testRun, tabGroup.getTabs().length).shouldBeEqual(2);
			valueOf(testRun, tabGroup.tabs[0]).shouldBeEqual(baseUITab);
			valueOf(testRun, tabGroup.tabs[1]).shouldBeEqual(secondUITab);
			valueOf(testRun, tabGroup.getActiveTab()).shouldBeEqual(baseUITab);
			valueOf(testRun,function(){tabGroup.setActiveTab(1)}).shouldNotThrowException();
			valueOf(testRun, tabGroup.getActiveTab()).shouldBeEqual(secondUITab);
			valueOf(testRun,function(){tabGroup.setActiveTab(2)}).shouldNotThrowException();
			valueOf(testRun, tabGroup.getActiveTab()).shouldNotBeEqual(baseUITab);
			valueOf(testRun, tabGroup.getActiveTab()).shouldNotBeEqual(secondUITab);			
			valueOf(testRun,function(){tabGroup.removeTab(secondUITab)}).shouldNotThrowException();
			valueOf(testRun, tabGroup.tabs.length).shouldBeEqual(1);

			finish(testRun);
			wind.close();
		});
	}
	
	// Testing diferent color properties with pixels calculation
	this.color_properties = function(testRun) {
		var wind = Titanium.UI.createWindow(),
			tabGroup = _createTabGroup();
		
		// Change function setActiveTabBackgroundColor
		valueOf(testRun,function() {tabGroup.setActiveTabBackgroundColor(BLUE_RGB)}).shouldNotThrowException();	
		valueOf(testRun,function() {tabGroup.setTabsBackgroundColor(YELLOW_RGB)}).shouldNotThrowException();	
	
		wind.add(tabGroup);
		wind.open();

		wind.addEventListener('postlayout', function() {
			cp.countPixelsPercentage(BLUE_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(MIN_TAB_BUTTON_PERCENT);

				cp.countPixelsPercentage(YELLOW_ARRAY, document.body, function(count) {
					valueOf(testRun, count).shouldBeGreaterThan(MAX_TAB_BUTTON_PERCENT);
					finish(testRun);
					wind.close();
				});

				finish(testRun);
				wind.close();				
			});	
		});
	}
	
	// Testing height properities
	this.height = function(testRun) {
		var wind = Titanium.UI.createWindow(),
			tabGroup = _createTabGroup();

		//Add tab group on window
		wind.add(tabGroup);
		valueOf(testRun,function(){tabGroup.setActiveTabBackgroundColor(BLUE_RGB)}).shouldNotThrowException();	
		
		wind.open();
		
		wind.addEventListener('postlayout',  function () {
			cp.countPixelsPercentage(BLUE_ARRAY, document.body, function (count) {
				valueOf(testRun, count).shouldBeGreaterThan(0);
				valueOf(testRun, count).shouldBeLessThan(MAX_TAB_BUTTON_PERCENT);
				tabGroup.tabHeight =600;
			});
		});
		
		// Timeout is necessary because function tabGroup.setTabHeight(600); doesn't have callback
		setTimeout(function() {
			cp.countPixelsPercentage(BLUE_ARRAY, document.body, function (count) {
				valueOf(testRun, count).shouldBeGreaterThan(MAX_TAB_BUTTON_PERCENT);
				finish(testRun);
				wind.close();
			});
		}, 1000);
	}
	
	// Testing open properties
	this.open = function(testRun) {
		var wind = Titanium.UI.createWindow(),
			tabGroup = Titanium.UI.createTabGroup(),
			redWin = Titanium.UI.createWindow({ backgroundColor: RED_RGB}),
			baseUITab = Ti.UI.createTab({
				title: 'base_ui_title',
				window: redWin
			});

		tabGroup.addTab(baseUITab);
		
		var greenWin = Titanium.UI.createWindow({ backgroundColor: GREEN_RGB});
			secondUITab = Ti.UI.createTab({
				title: 'second_ui_title',
				window: greenWin 
			});

		tabGroup.addTab(secondUITab);
		wind.add(tabGroup);
		
		wind.open();
		
		wind.addEventListener('postlayout',  function() {
			cp.countPixelsPercentage(RED_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WIND_PERCENT);
				valueOf(testRun, tabGroup.open).shouldBeFunction();
				valueOf(testRun, function(){tabGroup.open(secondUITab)}).shouldNotThrowException();
			});	
		});
		
		// Timeout is necessary because function tabGroup.close doesn't have callback
		setTimeout(function() {
			cp.countPixelsPercentage(GREEN_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WIND_PERCENT);
				finish(testRun);
				wind.close();
			});
		}, 1000);
		
		finish(testRun);
	}
	
	// Testing closed function
	// Failed https://jira.appcelerator.org/browse/TC-1756
	this.close = function(testRun) {
		var wind = Titanium.UI.createWindow(),
			tabGroup = _createTabGroup();
	
		wind.add(tabGroup);		
		wind.open();
		
		wind.addEventListener('postlayout', function() {
			cp.countPixelsPercentage(RED_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(MIN_WIND_PERCENT);
				valueOf(testRun, tabGroup.close).shouldBeFunction();
				valueOf(testRun, function(){tabGroup.close()}).shouldNotThrowException();
			});
		});
		
		// Timeout is necessary because function tabGroup.close doesn't have callback
		setTimeout(function() {
			cp.countPixelsPercentage(RED_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeLessThan(MIN_WIND_PERCENT);

				finish(testRun);
				wind.close();
			});
		}, 1000);
	}
	
	// Testing divider properties
	this.divide = function(testRun) {
		var wind = Titanium.UI.createWindow(),
			tabGroup = _createTabGroup();
		
		tabGroup.tabDividerColor = YELLOW_RGB;
		wind.add(tabGroup);		
		
		var yellowCount;
		
		wind.open();		
		
		wind.addEventListener('postlayout', function () {
			cp.countPixels(YELLOW_ARRAY, document.body, function(count) {
				yellowCount = count;
				valueOf(testRun, count).shouldBeGreaterThan(0);
				tabGroup.tabDividerWidth = 100;
			});
		});
		
		// Timeout is necessary because function tabGroup.close doesn't have callback
		setTimeout(function() {
			cp.countPixels(YELLOW_ARRAY, document.body, function(count) {
				valueOf(testRun, yellowCount).shouldNotBeUndefined();		
				valueOf(testRun, count).shouldBeGreaterThan(yellowCount);

				finish(testRun);
				wind.close();			
			});	
		}, 1000);
	}
	
	// Testing divider option
	this.images = function(testRun) {
		var wind = Titanium.UI.createWindow(),
			tabGroup = _createTabGroup();

		tabGroup.activeTabBackgroundImage = "/suites/ui/image_view/yellow_blue.png";
		tabGroup.tabsBackgroundImage = "/suites/ui/image_view/grey.png";
		
		wind.add(tabGroup);	
		wind.open();
		
		wind.addEventListener('postlayout', function() {
			cp.countPixels(YELLOW_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(0);

				cp.countPixels(GREY_ARRAY, document.body, function(count) {
					valueOf(testRun, count).shouldBeGreaterThan(0);
					finish(testRun);
					wind.close();
				});
			});
		});
	}
	
	// Testing divider option
	this.tabsAtBottom = function(testRun) {
		// Create main window
		// NOTE Set main window height greater then screen height
		// In this case tab grouo will be hiden
		var wind = Titanium.UI.createWindow(),
			tabGroup = _createTabGroup();

		tabGroup.setActiveTabBackgroundColor(BLUE_RGB);		
		
		tabGroup.setTabsBackgroundColor(BLUE_RGB);		
		wind.add(tabGroup);
		wind.open();
		
		var	checkedPosition = {};

		checkedPosition.width = 100;	
		checkedPosition.height = 100;

		wind.addEventListener('postlayout', function() {		
			cp.countPixels(BLUE_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeEqual(0);
				tabGroup.tabsAtBottom = false;
			},checkedPosition);
		});
		
		// Timeout is necessary because function tabGroup.close doesn't have callback
		setTimeout(function() {
			cp.countPixels(BLUE_ARRAY, document.body, function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(0);

				finish(testRun);
				wind.close();
			}, checkedPosition);
		}, 1000);
	}
}