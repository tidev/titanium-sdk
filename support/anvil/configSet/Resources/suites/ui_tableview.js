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

	this.name = "ui_tableview";
	this.tests = [
		{name: "deleterow", timeout: 10000},
		//{name: "rowHeight", timeout: 5000}, due to TIMOB-15779
		{name: "percentageHeight", timeout: 5000},
		{name: "scrollEventFalse", timeout: 5000},
		{name: "appendRowSupportArrayOfRows", timeout: 5000}
	];

	//TIMOB-11683 ,TIMOB-11523
	this.deleterow = function(testRun){
		var win = Ti.UI.createWindow();
		var table = Ti.UI.createTableView();
		win.add(table);
		var tableData = [];
		var r = Ti.UI.createTableViewRow({
			height: 80
		});
		tableData.push(r);
		table.setData(tableData);
		table.deleteRow(0);
		setTimeout(function(){
			valueOf(testRun, table.data[0].rows.length).shouldBe(0);

			finish(testRun);
		}, 4000);
		win.open();
	}

	//TIMOB-4134
	this.rowHeight = function(testRun){
		var win = Ti.UI.createWindow();
		var tableView = Ti.UI.createTableView({
			rowHeight: 65
		});
		tableView.addEventListener('postlayout', function(){
			valueOf(testRun, tableView.getRowHeight()).shouldBe(65);

			finish(testRun);
		});
		win.add(tableView);
		win.open();
	}

	//TIMOB-7612,TIMOB-9640 ,TIMOB-10477
	this.percentageHeight = function(testRun){
		var win1 = Titanium.UI.createWindow({  
			height: 400,
			width: 200,
			layout: 'vertical'
		});
		var tableView = Ti.UI.createTableView({
			height: '50%',
			width: '50%'
		});
		var rows = [];
		var row;
		for (var i = 0;i<4;i++) {
			row = Ti.UI.createTableViewRow();
			rows.push(row);
		}
		tableView.data = rows;
		tableView.addEventListener('postlayout', function(){
			valueOf(testRun, tableView.getHeight()).shouldBe('50%');
			valueOf(testRun, tableView.getWidth()).shouldBe('50%');

			finish(testRun);
		});
		win1.add(tableView);
		win1.open();
	}

	//TIMOB-8706
	this.scrollEventFalse = function(testRun){
		var win = Ti.UI.createWindow();
		var data = [];
		for (i = 0;i<50;i++){ 
			var row = Ti.UI.createTableViewRow();
			data.push(row);
		}
		var autocomplete_table = Titanium.UI.createTableView({ 
			scrollable: true, 
			top: 170,
			data:data
		});
		win.add(autocomplete_table);
		var scrollEvent = false; 
		autocomplete_table.addEventListener('scroll', function() { 
			scrollEvent = true;
		});
		setTimeout(function(){
			valueOf(testRun,scrollEvent).shouldBeFalse();

			finish(testRun);
		}, 2000); 
		win.open();
	}

	//TIMOB-4917
	this.appendRowSupportArrayOfRows = function(testRun){
		var win = Ti.UI.createWindow();
		var table = Ti.UI.createTableView();
		win.add(table);
		win.open();
		var currentRows = [];
		var b1 = Ti.UI.createButton({
			bottom: 10,
		});
		setTimeout(function(){
			var rowdata = [];
			var label = Ti.UI.createLabel({
				left: 100,
				top: 10,
				bottom: 10,
			});
			var r = Ti.UI.createTableViewRow({
				height: 80,
				color: 'blue'
			});
			r.add(label);
			for(var i = 0; i<2; i++){
				rowdata.push(r)
			}
			valueOf(testRun, function(){
				table.appendRow(rowdata);
			}).shouldNotThrowException();
			valueOf(testRun, table.data[0].rows.length).shouldBe(2);

			finish(testRun);
		}, 2000);
	}
}
