/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish,
		valueOf;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "mobile_navigation_group";
	this.tests = [
		{name: "base"},
		{name: "topBottom"}
	];

	this.base = function(testRun) {	
		// Open main window
		var win1 = Titanium.UI.createWindow(),
			// Open first window
			win2 = Titanium.UI.createWindow({
				backgroundColor: 'red',
				title: 'Red Window'
			}),
			// Open second window
			win3 = Titanium.UI.createWindow({
				backgroundColor: 'blue',
				title: 'Blue Window'
			}),
			// Create navigation group window propertie - first window
			nav;

		valueOf(testRun, function() {
			nav = Titanium.UI.MobileWeb.createNavigationGroup({
			   window: win2
			});
		}).shouldNotThrowException();
		
		// Check type of navigation group
		valueOf(testRun,nav instanceof Titanium.UI.MobileWeb.NavigationGroup).shouldBeTrue();
		
		// Added navBar to main window
		win1.add(nav);
		win1.open();
		
		// Check get window property
		var window;
		valueOf(testRun, function() {
			window = nav.getWindow();
		}).shouldNotThrowException();

		valueOf(testRun,window).shouldBeExactly(win2);
		valueOf(testRun,nav.window).shouldBeExactly(win2);

		// Call open function
		valueOf(testRun, function() {
			nav.open(win3);
		}).shouldNotThrowException();		
		valueOf(testRun, function() {
			nav.open(win2);
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			nav.close(win3);
		}).shouldNotThrowException();		

		// Negative scenario -
		valueOf(testRun, function() {
			nav.open(win3);
		}).shouldThrowException();		

		// Negative scenario - Call open with no correct data
		valueOf(testRun, function() {
			nav.open();
		}).shouldThrowException();		

		// Close main window
		win1.close();
		finish(testRun);
	}

	this.topBottom = function(testRun) {
		// Open main window
		var win1 = Titanium.UI.createWindow(),
			// Open first window
			win2 = Titanium.UI.createWindow({
				backgroundColor: 'red',
				title: 'Red Window'
			}),
			// Open second window
			win3 = Titanium.UI.createWindow({
				backgroundColor: 'blue',
				title: 'Blue Window'
			}),
			// Create navigation group window propertie - first window
			nav;

		valueOf(testRun, function() {
			nav = Titanium.UI.MobileWeb.createNavigationGroup({
			   window: win2
			});
		}).shouldNotThrowException();

		// Added navBar to main window
		win1.add(nav);
		win1.open();		

		// Check NavBarAtTop parameter
		valueOf(testRun,nav._children[0].rect.y).shouldBeZero(0);

		// Call setNavBarAtTop
		valueOf(testRun, function() {
			nav.setNavBarAtTop(false);
		}).shouldNotThrowException();

		// Check NavBarAtTop parameter
		valueOf(testRun, nav.getNavBarAtTop()).shouldBeFalse();

		// Call setNavBarAtTop
		valueOf(testRun, function() {
			nav.setNavBarAtTop(true);
		}).shouldNotThrowException();	
		
		// Check NavBarAtTop parameter
		valueOf(testRun, nav.getNavBarAtTop()).shouldBeTrue();

		// Close main window
		win1.close();
		finish(testRun);
	}
}