/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

// Simple automated tests for Ti.UI.TabGroup.

module.exports = new function() {
	var finish,
		valueOf,
		RED_RGB = '#ff0000',
		GREEN_RGB = '#00ff00',
		TITLE = 'base_ui_title';

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "tab";
	this.tests = [
		{name: "base_no_pix"},
		{name: "active_no_pix"}
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
	
	// Test types of basic properties, verify the tab group remembers its configuration.
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

	// Fails because https://jira.appcelerator.org/browse/TC-1740
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
}