/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

module.exports = new function() {
	var finish,
		valueOf;
		
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "picker";
	this.tests = [
		{name: "column", timeout: 5000},
		{name: "row", timeout: 5000}
	];		

	this.column = function(testRun) {
		var fruit = ['Bananas', 'Grapes', 'Blueberries', 'Strawberries'], 
			column1 = Ti.UI.createPickerColumn(),
			i = 0, ilen = fruit.length;
		
		for (; i < ilen; i++){
			var row = Ti.UI.createPickerRow({
			  title: fruit[i]
			});
			
			valueOf(testRun, function() {
				column1.addRow(row);
			}).shouldNotThrowException();
		}
		
		valueOf(testRun, column1.rowCount).shouldBe(fruit.length);
		valueOf(testRun, column1.getRowCount()).shouldBe(fruit.length);
		valueOf(testRun, column1.rows instanceof Array).shouldBeTrue();
		valueOf(testRun, column1.rows[0] instanceof Ti.UI.PickerRow).shouldBeTrue();
		valueOf(testRun, column1.getRows() instanceof Array).shouldBeTrue();
		valueOf(testRun, column1.getRows()[0] instanceof Ti.UI.PickerRow).shouldBeTrue();
		valueOf(testRun, column1.rows.length).shouldBeEqual(fruit.length);
		valueOf(testRun, column1.selectedRow.title).shouldBeEqual(fruit[0]);
		valueOf(testRun, function(){
			column1.setSelectedRow(column1.getRows()[1])
		}).shouldNotThrowException();
		valueOf(testRun, column1.selectedRow.title).shouldBeEqual(fruit[1]);		
		valueOf(testRun, function(){
			column1.removeRow(column1.getRows()[1])
		}).shouldNotThrowException();
		valueOf(testRun, column1.getRowCount()).shouldBe(fruit.length-1);
		
		finish(testRun);
	}
		
		
	this.row = function(testRun) {
		// Check all methdos and properties for row
		var row;
		
		valueOf(testRun, function() {
			row = Ti.UI.createPickerRow({title:'First'});
		}).shouldNotThrowException();
		
		valueOf(testRun, row.color).shouldBeUndefined();
		valueOf(testRun, row.font).shouldBeUndefined();
		valueOf(testRun, row.title).shouldBeEqual('First');
		
		valueOf(testRun, function() {
			row.setColor('#00FF00')
		}).shouldNotThrowException();
		
		valueOf(testRun, function() {
			row.setFont({
				fontSize: 24
			});
		}).shouldNotThrowException();
		
		valueOf(testRun, function() {
			row.setTitle('First new');
		}).shouldNotThrowException();
		
		valueOf(testRun, row.color).shouldBeEqual('#00FF00');
		valueOf(testRun, row.font.fontSize).shouldBeEqual('24px');
		valueOf(testRun, row.title).shouldBeEqual('First new');
		valueOf(testRun, row.getColor()).shouldBeEqual('#00FF00');
		valueOf(testRun, row.getFont().fontSize).shouldBeEqual('24px');
		valueOf(testRun, row.getTitle()).shouldBeEqual('First new');
		
		finish(testRun);
	}
}
