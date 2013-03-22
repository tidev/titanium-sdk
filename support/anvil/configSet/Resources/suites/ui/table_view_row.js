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
		YELLOW_RGB_ARRAY = [255, 255, 0 ],
		GREEN_RGB_ARRAY= [0, 255, 0 ],
		RED_RGB_ARRAY = [255, 0, 0 ],
		RED_RGB = '#ff0000',
		GREEN_RGB = '#00ff00',
		YELLOW_RGB = '#ffff00',
		cp = new CountPixels();
	
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "table_view_row";
	this.tests = [
		{name: "baseNoPix"},
		{name: "color"},
		{name: "child"},
		{name: "images"}
	];

	// Helper function for creating testing environment
	// Create window,
	// Create tableView with two table Row
	// parameter:postLayotCallback - function
	// this function settedon on windows postlayout event
	function createTestEnv(postLayotCallback) {
		Ti.UI.backgroundColor = "white";
		this.win = Ti.UI.createWindow();	
		
		this.tableView = Ti.UI.createTableView();
		this.firstRow = Ti.UI.createTableViewRow({
			className: 'row',
			objName: 'row',
			touchEnabled: true,
			height: 100,
			backgroundColor:RED_RGB, 
			title:"this.firstRow"	  
		});

		this.tableView.appendRow(this.firstRow);
		this.secondRow = Ti.UI.createTableViewRow({
			className: 'row',
			objName: 'row',
			touchEnabled: true,
			height: 100,
			backgroundColor:RED_RGB, 
			title:"this.secondRow "	  
		});

		this.tableView.appendRow(this.secondRow);
		this.win.add(this.tableView);
			
		if (postLayotCallback) {
			this.win.addEventListener('postlayout',  postLayotCallback);
		}

		this.win.open();
	}

	// Test checking background TableView
	this.baseNoPix = function(testRun) {
		var testEnv = new createTestEnv(),		
			section = testEnv.tableView.sections[0];
		
		valueOf(testRun, testEnv.tableView.sections).shouldBeArray();	
		valueOf(testRun, section).shouldBeObject();
		valueOf(testRun, section.rowCount).shouldBeEqual(2);
		valueOf(testRun, section.rows[0].declaredClass).shouldBeEqual("Ti.UI.TableViewRow");
		valueOf(testRun, section.rows[0]).shouldBeExactly(testEnv.firstRow);
		valueOf(testRun, section.rows[1].declaredClass).shouldBeEqual("Ti.UI.TableViewRow");
		valueOf(testRun, section.rows[1]).shouldBeExactly(testEnv.secondRow);
		valueOf(testRun, testEnv.tableView.sections[0].rowCount).shouldBeEqual(2);	
		valueOf(testRun, testEnv.firstRow.className).shouldBeEqual('row');
		valueOf(testRun, testEnv.firstRow.font).shouldBeString();
		valueOf(testRun, testEnv.firstRow.hasChild).shouldBeBoolean();

		finish(testRun);
	}

	// Test checking colors TableViewRows
	this.color = function(testRun) {
		//This function will be setted on the WINDOW postlayout event
		var postLayotCallback = function() {
				cp.countPixels(GREEN_RGB_ARRAY, document.body, function(count) {
					// Check for NOT existing green color on the screen
					valueOf(testRun, count).shouldBeEqual(0);
					
					// Check for NOT existing yellow color on the screen
					cp.countPixels(YELLOW_RGB_ARRAY, document.body, function(count) {
						valueOf(testRun, count).shouldBeEqual(0);
						testEnv.firstRow.backgroundColor = GREEN_RGB;	
						testEnv.firstRow.color = YELLOW_RGB;	
					});
				});
			},
			testEnv = new createTestEnv(postLayotCallback);
		
		// Use setTimeout because 
		// row.addEventListener("postlayout", doesn't wokr correclty		
		setTimeout(function() {
			cp.countPixels(GREEN_RGB_ARRAY, document.body, function(count) {
				//Check for existing green color on the screen
				valueOf(testRun, count).shouldBeGreaterThan(0);
				
				cp.countPixels(YELLOW_RGB_ARRAY, document.body, function(count) { 
					valueOf(testRun, count).shouldBeGreaterThan(0);
					//Close window
					testEnv.win.close();
					finish(testRun);
				});	
			});
		}, 1000);
	}

	// Test checking child TableViewRows
	this.child = function(testRun) {
		var countPixelsBeforChild = 0,		
			// Create test env
			testEnv = new createTestEnv(function() {
				//This function will be setted on the WINDOW postlayout event	
				cp.countPixels(RED_RGB_ARRAY, document.body, function(count) {
					//Save number of Red pixels into variable
					countPixelsBeforChild = count;
					//Add child button into the tableViewRow
					testEnv.firstRow.hasChild = true;
					testEnv.secondRow.hasChild = true;
				});			
			});
		
		// Use setTimeout because 
		// row.addEventListener("postlayout", doesn't wokr correclty
		setTimeout(function() {
			cp.countPixels(RED_RGB_ARRAY, document.body, function(count) { 
				//Number of Red pixels should decrease
				//Because grey child button appeare on the screen
				valueOf(testRun, count).shouldBeLessThan(countPixelsBeforChild);

				testEnv.win.close();
				finish(testRun);
			});
		},2000);
	}
	
	this.images = function(testRun) {
		var countPixelsBeforChild = 0,
			//This function will be setted on the WINDOW postlayout event
			postLayotCallback = function(){
				//Check NO existting Yellow and green color on the screen
				cp.countPixels(YELLOW_RGB_ARRAY, document.body, function(count) {
					valueOf(testRun, count).shouldBeEqual(0);

					cp.countPixels(GREEN_RGB_ARRAY, document.body, function(count) {
						valueOf(testRun, count).shouldBeEqual(0);
						// Add right and left image into the row
						// Images has yellow and green colors inside 
						testEnv.firstRow.rightImage = "/suites/ui/image_view/yellow_blue.png";
						testEnv.firstRow.leftImage = "/suites/ui/image_view/image2.png";
					});				
				});			
			},

			testEnv = new createTestEnv(postLayotCallback);
		
		// Use setTimeout because 
		// row.addEventListener("postlayout", doesn't wokr correclty		
		setTimeout(function() {
			cp.countPixels(YELLOW_RGB_ARRAY, document.body,function(count) {
				//Check appearence yellow and green colors on the screen
				valueOf(testRun, count).shouldBeGreaterThan(0);

				cp.countPixels(GREEN_RGB_ARRAY, document.body,function(count) {
					valueOf(testRun, count).shouldBeGreaterThan(0);

					testEnv.win.close();
					finish(testRun);
				});
			});
		}, 2000);
	}
}