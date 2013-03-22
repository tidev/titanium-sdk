/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

var isTizen = Ti.Platform.osname === 'tizen',
	isMobileWeb = Ti.Platform.osname === 'mobileweb';

(isTizen || isMobileWeb) && Ti.include('countPixels.js');

module.exports = new function() {
	var finish,
		valueOf;
		
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "picker";
	this.tests = [
		{name: "basic_picker", timeout: 5000},
		{name: "picker_columns", timeout: 5000},
		{name: "get_set_row", timeout: 5000},
		{name: "time_picker", timeout: 5000},
		{name: "date_picker", timeout: 5000},
		{name: "date_time_picker", timeout: 5000},
		{name: "column", timeout: 5000},
		{name: "row", timeout: 5000}
	];

	this.basic_picker = function(testRun) {
		// Verify if green picker's pixels  appear in the red window
		var win = Ti.UI.createWindow({
				backgroundColor: '#FF0000'
			}),
			picker;
		
		valueOf(testRun, function() {
			picker = Ti.UI.createPicker({
				backgroundColor: '#00FF00'
			});
		}).shouldNotThrowException();
		
		var onPickerComplete = function(count) {
			valueOf(testRun, count).shouldBeGreaterThan(1000);
			win.close();
			finish(testRun);
		}
		
		var data = [];
		
		valueOf(testRun, function() {
			data[0] = Ti.UI.createPickerRow({title:'First'});
		}).shouldNotThrowException();
		
		valueOf(testRun, function() {
			data[1] = Ti.UI.createPickerRow({title:'Second'});
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			picker.add(data);
		}).shouldNotThrowException();
		
		if (isTizen || isMobileWeb) {
			var cp = new CountPixels();
		}
		
		win.addEventListener("postlayout", function() {
			if (isTizen || isMobileWeb) {
				cp.countPixels([0, 255, 0], win, onPickerComplete);
			} else {
				win.close();
				finish(testRun);
			}
		})

		win.add(picker);
		win.open();
	}
		
		
	this.picker_columns = function(testRun) {
		// Try to create and add to picker two columns (green and blue)
		// Verify if green and red column's pixels appear in the red window
		// Check the picker's methods setColumns() and getColumns() 
		var fruit = ['Bananas', 'Grapes', 'Blueberries', 'Strawberries'],
			color = ['blue', 'red', 'yellow', 'white'],
			column1,
			column2,
			win = Ti.UI.createWindow({
				backgroundColor: '#FF0000'
			}),
			picker = Ti.UI.createPicker(),
			i = 0, 
			ilen = fruit.length;
		
		valueOf(testRun, function(){
			column1 = Ti.UI.createPickerColumn({
				backgroundColor: '#00FF00'
			});
		}).shouldNotThrowException();
		
		for (; i < ilen; i++) {
			var row = Ti.UI.createPickerRow({
				title: fruit[i]
			});
			
			valueOf(testRun, function() {
				column1.addRow(row);
			}).shouldNotThrowException();
		}
		
		valueOf(testRun, function() {
			column2 = Ti.UI.createPickerColumn({
				backgroundColor: '#0000FF'
			});
		}).shouldNotThrowException();

		for (var i = 0, ilen = color.length; i < ilen; i++) {			
			var row = Ti.UI.createPickerRow({
				title: color[i]
			});
			
			valueOf(testRun, function() {
				column2.addRow(row);
			}).shouldNotThrowException();
		}
		
		valueOf(testRun, function() {
			picker.setColumns([column1, column2])
		}).shouldNotThrowException();
		
		if (isTizen || isMobileWeb) {
			var cp = new CountPixels();
			
			var onReadyColumn2 = function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(1000);
				win.close();
				finish(testRun);
			}
			
			var onReadyColumn1 = function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(1000);
				cp.countPixels([0, 0, 255], win, onReadyColumn2);
			}
		} else {
			win.close();
			finish(testRun);
		}
		
		win.addEventListener("postlayout", function() {
			var columns;
			
			function testColumns(columns) {
				valueOf(testRun, columns instanceof Array).shouldBeTrue();
				valueOf(testRun, columns[0] instanceof Ti.UI.PickerColumn).shouldBeTrue();
				valueOf(testRun, columns.length).shouldBeEqual(2);
			}
			
			valueOf(testRun, function(){
				columns = picker.getColumns();
			}).shouldNotThrowException();
			
			testColumns(columns);
			
			columns = picker.columns;
			
			testColumns(columns);
			
			cp.countPixels([0, 255, 0], win, onReadyColumn1);
		});    
		win.add(picker);
		win.open();
	}
		
		
	this.get_set_row = function(testRun) {
		//Try to set and get one of the row from picker
		//Check the choosen row by text and with pixel tests the 
		//color of text (first - green, second - blue);
		var first_text = '&#9607;&#9607;&#9607;', //&#9607;-it's filled square and we 
												  //can check the color for this symbol without
												  // worrying about antialiasing
			second_text = '&#9607;&#9607;&#9607;&#9607;&#9607;&#9607;',
			win = Ti.UI.createWindow({
				backgroundColor: '#FF0000'
			}),
			picker = Ti.UI.createPicker({
				backgroundColor: '#FF0000'
			});
		
		// Type
		valueOf(testRun, picker.type).shouldBeEqual(Titanium.UI.PICKER_TYPE_PLAIN);
		
		var data = [];
		
		valueOf(testRun, function() {
			//Fisrt green
			data[0] = Ti.UI.createPickerRow({title: first_text, color: '#00FF00'});
		}).shouldNotThrowException();
		
		valueOf(testRun, function() {
			// Second blue
			data[1] = Ti.UI.createPickerRow({title:second_text, color: '#0000FF'});
		}).shouldNotThrowException();
		
		valueOf(testRun, function() {
			picker.add(data);
		}).shouldNotThrowException();
		
		if (isTizen || isMobileWeb) {
			var cp = new CountPixels();
			
			var onBlueActive = function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(100);
				valueOf(testRun, picker.getSelectedRow(0).color).shouldBeEqual('#0000FF');
				valueOf(testRun, picker.getSelectedRow(0).title).shouldBeEqual(second_text);
				win.close();
				finish(testRun);
			}
			
			var onGreenActive = function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(100);
				valueOf(testRun, picker.getSelectedRow(0).color).shouldBeEqual('#00FF00');
				valueOf(testRun, picker.getSelectedRow(0).title).shouldBeEqual(first_text);
				
				valueOf(testRun, function() {
					picker.setSelectedRow(0, 1, false);
				}).shouldNotThrowException();
				
				cp.countPixels([0, 0, 255], win, onBlueActive);
			}
		} else {
			win.close();
			finish(testRun);
		}
		
		win.addEventListener("postlayout", function() {
			cp.countPixels([0, 255, 0], win, onGreenActive);
		});

		win.add(picker);
		win.open();
	}
		
		
	this.time_picker = function(testRun) {
		// Verify if green time picker's pixels appear in the red window
		// check the setType and getType methods for picker
		var win = Ti.UI.createWindow({
				backgroundColor: '#FF0000'
			}),
			picker = Ti.UI.createPicker({
				backgroundColor: '#00FF00'
			});
		
		if (isTizen || isMobileWeb) {
			var cp = new CountPixels(),			
				greenPixelsCB = function(count) {
					valueOf(testRun, count).shouldBeGreaterThan(1000);
					win.close();
					finish(testRun);
				};
		} else {
			win.close();
			finish(testRun);
		}
		
		valueOf(testRun, picker.getType()).shouldBeEqual(Titanium.UI.PICKER_TYPE_PLAIN); //type
		
		valueOf(testRun, function() {
			picker.setType(Ti.UI.PICKER_TYPE_TIME);
		}).shouldNotThrowException();
		
		win.addEventListener("postlayout", function() {
			valueOf(testRun, picker.getType()).shouldBeEqual(Ti.UI.PICKER_TYPE_TIME);
			cp.countPixels([0, 255, 0], win, greenPixelsCB);
		})
		
		win.add(picker);
		win.open();
	}
		
		
	this.date_picker = function(testRun) {
		// Verify if green date picker's pixels appear in the red window
		// Try to set min and max date and check these properties
		var win = Ti.UI.createWindow({
				backgroundColor: '#FF0000'
			}),
			minDate = new Date();

		minDate.setFullYear(2009);
		minDate.setMonth(0);
		minDate.setDate(1);

		var maxDate = new Date();
		maxDate.setFullYear(2010);
		maxDate.setMonth(11);
		maxDate.setDate(31);

		var value = new Date();
		value.setFullYear(2009);
		value.setMonth(0);
		value.setDate(5);
		
		var lessThanMinValue = new Date();
		lessThanMinValue.setFullYear(2007);
		lessThanMinValue.setMonth(0);
		lessThanMinValue.setDate(5);
		
		var picker = Ti.UI.createPicker({
			backgroundColor: '#0000FF',
			type: Ti.UI.PICKER_TYPE_DATE,
			value: value
		});
		
		if (isTizen || isMobileWeb) {
			var cp = new CountPixels();
			
			var bluePixelsCB = function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(1000);
				valueOf(testRun, picker.getMaxDate()).shouldBeUndefined();
				valueOf(testRun, picker.getMinDate()).shouldBeUndefined();
				
				valueOf(testRun, function(){
					picker.setMaxDate(maxDate);
				}).shouldNotThrowException();
				
				valueOf(testRun, function(){
					picker.setMinDate(minDate);
				}).shouldNotThrowException();
				
				valueOf(testRun, function(){
					picker.setValue(lessThanMinValue);
				}).shouldNotThrowException();
				
				valueOf(testRun, picker.getMaxDate() instanceof Date).shouldBeTrue();
				valueOf(testRun, picker.getMinDate() instanceof Date).shouldBeTrue();
				valueOf(testRun, picker.maxDate instanceof Date).shouldBeTrue();
				valueOf(testRun, picker.minDate instanceof Date).shouldBeTrue();
				valueOf(testRun, picker.getValue() instanceof Date).shouldBeTrue();
				valueOf(testRun, picker.value instanceof Date).shouldBeTrue();
			   
				// This test will be fail on Tizen. Min and max for date picker is not supported.
				// https://developer.tizen.org/help/topic/org.tizen.web.uiwidget.apireference/html/widgets/widget_datetimepicker.htm
				valueOf(testRun, picker.getValue().getFullYear()).shouldBeGreaterThanEqual(picker.getMinDate().getFullYear());
				
				win.close();
				finish(testRun);
			}
		} else {
			win.close();
			finish(testRun);
		}
		
		win.addEventListener("postlayout", function() {
			cp.countPixels([0, 0, 255], win, bluePixelsCB);
		})
		
		win.add(picker);
		win.open();
	}
		
		
	this.date_time_picker = function(testRun) {
		// Verify if green dateTime picker's pixels appear in the red window		
		var win = Ti.UI.createWindow({
				backgroundColor: '#FF0000'
			}),
			picker = Ti.UI.createPicker({
				backgroundColor: '#00FF00',
				type: Ti.UI.PICKER_TYPE_DATE_AND_TIME
			});
		
		if (isTizen || isMobileWeb) {
			var cp = new CountPixels(),
				greenPixelsCB = function(count){
					valueOf(testRun, count).shouldBeGreaterThan(1000);
					win.close();
					finish(testRun);
				};
		} else {
			win.close();
			finish(testRun);
		}
		
		win.addEventListener("postlayout", function() {
			cp.countPixels([0, 255, 0], win, greenPixelsCB);
		})
		
		win.add(picker);
		win.open();
	}

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
