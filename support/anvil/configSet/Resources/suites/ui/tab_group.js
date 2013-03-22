/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

module.exports = new function() {
	var finish,
		valueOf,
		RED_RGB = '#ff0000',
		GREEN_RGB = '#00ff00';

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "tab_roup";
	this.tests = [
		{name: "base_no_pix"}
	];
	
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
}