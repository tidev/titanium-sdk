/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}
	
	this.name = "ui_tableViewRow";
	this.tests = [
		{name: "dpDimension"},
		{name: "setHeaderOutsideTable", timeout: 30000},
		{name: "updateNumberOfRows"}, 
		{name: "accesTableViewRow"}
	];

	//TIMOB-5089
	this.dpDimension = function(testRun){
		var win = Ti.UI.createWindow();
		var table = Ti.UI.createTableView();
		for (var i = 0; i < 5; i++) {
			var row = Ti.UI.createTableViewRow({height:'110dp'});
			var imageview = Ti.UI.createImageView({
				image: '/suites/ui_tableViewRow/ui_tableViewRow/gradient.png',
				height: '100dp',
				width: '100dp'
			});
			row.add(imageview);
			table.appendRow(row);
		};
		var closeEvent = 0;
		win.add(table);
		win.addEventListener('focus', function(){
			valueOf(testRun, row.getHeight()).shouldBe('110dp');
			valueOf(testRun, imageview.getHeight()).shouldBe('100dp');
			valueOf(testRun, imageview.getWidth()).shouldBe('100dp');
		});
		win.addEventListener('close', function(){
			closeEvent += 1;
		});
		setTimeout(function(){
			valueOf(testRun, closeEvent).shouldBe(0);

			finish(testRun);
		}, 2000);
		win.open();
	}

	//TIMOB-6368
	this.setHeaderOutsideTable = function(testRun){
		var win = Titanium.UI.createWindow();
		var table = Titanium.UI.createTableView({
			height: 100,
			width: 200
		});
		var addrow = function(){
			var row = Ti.UI.createTableViewRow({
				height: 65
			});
			row.header = 'A';
			table.appendRow(row);
		}
		for(var i = 0; i<200; i++){
			addrow();
		}
		win.add(table);
		table.addEventListener('postlayout', function(){
			valueOf(testRun,table.getHeight()).shouldBe(100);
			valueOf(testRun,table.getWidth()).shouldBe(200);

			finish(testRun);
		});
		win.open();
	}

	//TIMOB-9890
	this.updateNumberOfRows = function(testRun){
		var win1 = Titanium.UI.createWindow();
		var table = Ti.UI.createTableView({
			top: 0
		});
		win1.add(table);
		function fun(){
			addRows(5);
			assertRowCount(5);
			removeRows(1);
			assertRowCount(4);

			finish(testRun);
		};
		function assertRowCount(expectedCount) {
			var actualCount = 0;
			if (table.data[0].rows) {
				actualCount = table.data[0].rows.length;
			}
			valueOf(testRun, actualCount).shouldBe(expectedCount);
		}
		function removeRows(count) {
			if (!table.data[0] || table.data[0].rows.rowCount < count) {
				return; 
			}
			var tableData = table.data[0].rows;
			for (var i = 0;i<count;i++) {
				tableData.pop();
			}
			table.data = tableData;
		}
		function addRows(count) {
			var tableData;
			if (table.data[0]) {
				tableData = table.data[0].rows;
			} else {
				tableData = new Array();
			}
			for (var i = 0;i<count;i++) {
				var row = Ti.UI.createTableViewRow();
				tableData.push(row);
			}
			table.data = tableData;
		}
		win1.addEventListener('focus', fun);
		win1.open();
	}

	//TIMOB-5982, TIMOB-8050
	this.accesTableViewRow = function(testRun){
		var _window = Titanium.UI.createWindow();
		var myTableView = Ti.UI.createTableView();
		var row = Ti.UI.createTableViewRow({
			height : 80,
		});
		myTableView.appendRow(row);
		_window.add(myTableView);
		_window.addEventListener('open', function() {
			setTimeout(function() {
				var tableRows = myTableView.data[0].rows;
				valueOf(testRun, function(){
					tableRows.pop();
					myTableView.data = tableRows;
				}).shouldNotThrowException();

				finish(testRun);
			}, 2000);
		});
		_window.open();
	}
}