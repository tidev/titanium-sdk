/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

if (Ti.Platform.osname === 'tizen' || Ti.Platform.osname === 'mobileweb') {
   Ti.include('countPixels.js');
}

module.exports = new function() {
	var finish,
		valueOf,
		GREEN_RGB_ARRAY = [0, 255, 0 ],
		RED_RGB = '#ff0000',
		GREEN_RGB = '#00ff00',
		cp = new CountPixels();
	
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "table_view";
	this.tests = [
		{name: "background"},
		{name: "separatorColor"}
	];
	

	// Helper function for creating testing environment
	// Create window,
	// Create tableView with table data
	// parameter:postLayotCallback - function
	// this function settedon on windows postlayout event
	function _createTestEnv(postLayotCallback) {
		Ti.UI.backgroundColor = RED_RGB;
		this.win = Ti.UI.createWindow();
		
		this.tableData = [ 
			{title: 'Apples'}, 
			{title: 'Bananas'}, 
			{title: 'Carrots'}, 
			{title: 'Potatoes'} 
		];
		
		this.tableView = Ti.UI.createTableView({
		  data: this.tableData
		});

		this.win.add(this.tableView);
			
		postLayotCallback && this.win.addEventListener('postlayout',  postLayotCallback);

		this.win.open();
	}
				
	// Test checking background TableView
	this.background = function(testRun) {
		//This function will be setted on the WINDOW postlayout event
		var postLayotCallback = function() {
			cp.countPixels(GREEN_RGB_ARRAY, document.body,function(count) {
				// Check for NOT existing green color on the screen
				valueOf(testRun, count).shouldBeEqual(0);
				// Set backgroundColor into the green color
				testEnv.tableView.backgroundColor = GREEN_RGB;
			});
		};

		// Create test env
		var testEnv = new _createTestEnv(postLayotCallback);

		// Use setTimeout because 
		// testEnv.tableView.addEventListener("postlayout", 
		// don't work correctly after testEnv.tableView.backgroundColor = GREEN_RGB;
		setTimeout(function() {
			cp.countPixels(GREEN_RGB_ARRAY, document.body, function(count) {
				//Check for existing green color on the screen
				valueOf(testRun, count).shouldBeGreaterThan(0);
				
				//Close window
				testEnv.win.close();
				finish(testRun);
			});
		}, 2000);
	}
	
	// Test checking separatorColor TableView
	this.separatorColor = function(testRun) {
		// This function will be setted on the TABLEVIEW postlayout event
		// After tableView.separatorColor = GREEN_RGB
		var checkGreenColorExisting =function() {
			cp.countPixels(GREEN_RGB_ARRAY, document.body, function(count) {
				//Check for existing green color on the screen
				valueOf(testRun, count).shouldBeGreaterThan(0);
				
				testEnv.win.close();
				finish(testRun);
			});
		};

		//This function will be setted on the WINDOW postlayout event	
		var postLayotCallback = function(){
			cp.countPixels(GREEN_RGB_ARRAY, document.body,function(count){ 
				//Check for NOT existing green color on the screen
				valueOf(testRun, count).shouldBeEqual(0);	
				//Set separator color in green
				testEnv.tableView.separatorColor = GREEN_RGB;
				testEnv.tableView.addEventListener("postlayout", checkGreenColorExisting);
			});
		};

		var testEnv = new _createTestEnv(postLayotCallback);
	}
}