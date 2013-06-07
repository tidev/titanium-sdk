/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

// Simple automated tests for Titanium.UI.TableViewRow.

module.exports = new function() {
	var finish,
		valueOf,
		RED_RGB = '#ff0000';
	
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "table_view_row";
	this.tests = [
		{name: "baseNoPix"}
	];

	// Helper function for creating testing environment.
	// Create a window, a tableView with two table Rows,
	// and set a postLayout callback.
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

	// Test the types and values of properties of newly created TableViewRows.
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
}