/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('Titanium.UI.Picker', function() {
	this.timeout(10000);

	var fruit = ['Bananas', 'Strawberries', 'Mangos', 'Grapes'];
	var color = ['red', 'green', 'blue', 'orange', 'red', 'green', 'blue', 'orange'];
	var win;

	afterEach(function() {
		if (win) {
			win.close();
		}
		win = null;
	});

	it('DatePicker', function(finish) {
		win = Ti.UI.createWindow({
			backgroundColor: '#000'
		});
		var date = new Date(),
			picker = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_DATE,
				value: date
			});
		win.add(picker);
		win.addEventListener('open', function() {
			try {
				should(picker.getValue()).be.eql(date);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it('TimePicker', function(finish) {
		win = Ti.UI.createWindow({
			backgroundColor: '#000'
		});
		var date = new Date(),
			picker = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_TIME,
				value: date
			});
		win.add(picker);
		win.addEventListener('open', function() {
			try {
				should(picker.getValue()).be.eql(date);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it('PlainPicker', function(finish) {
		win = Ti.UI.createWindow({
			backgroundColor: '#000'
		});
		var picker = Ti.UI.createPicker({
			type: Ti.UI.PICKER_TYPE_PLAIN
		});
		win.add(picker);
		win.addEventListener('open', function() {
			try {
				should(picker).be.an.Object;
				picker.getValue();

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it('PlainPicker.add(PickerColumn)', function(finish) {
		win = Ti.UI.createWindow({
			backgroundColor: '#000'
		});
		var picker = Ti.UI.createPicker({
			type: Ti.UI.PICKER_TYPE_PLAIN
		});

		win.add(picker);
		win.addEventListener('open', function() {
			try {
				var column = Ti.UI.createPickerColumn();
				for (var i = 0, ilen = fruit.length; i < ilen; i++) {
					var row = Ti.UI.createPickerRow({
						title: fruit[i], color: color[i], font: { fontSize: 24 },
					});
					column.addRow(row);
				}
				picker.add(column);

				should(picker.columns.length).be.eql(1);
				should(picker.columns[0]).be.an.Object;
				should(picker.columns[0].rows).be.an.Array;
				should(picker.columns[0].rows.length).be.eql(fruit.length);

				finish();
			}
			catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it('PlainPicker.add(multiple PickerColumn)', function(finish) {
		win = Ti.UI.createWindow({
			backgroundColor: '#000'
		});
		var picker = Ti.UI.createPicker({
			type: Ti.UI.PICKER_TYPE_PLAIN
		});

		win.add(picker);
		win.addEventListener('open', function() {
			try {
			var column1 = Ti.UI.createPickerColumn();
				for (var i = 0, ilen = fruit.length; i < ilen; i++) {
					var row = Ti.UI.createPickerRow({
						title: fruit[i], color: color[i], font: { fontSize: 24 },
					});
					column1.addRow(row);
				}

				var column2 = Ti.UI.createPickerColumn();
				for (var i = 0, ilen = color.length; i < ilen; i++) {
					var row = Ti.UI.createPickerRow({
						title: color[i]
					});
					column2.addRow(row);
				}

				picker.add([column1, column2]);

				should(picker.columns.length).be.eql(2);
				should(picker.columns[0]).be.an.Object;
				should(picker.columns[0].rows).be.an.Array;
				should(picker.columns[0].rows.length).be.eql(fruit.length);

				should(picker.columns[1]).be.an.Object;
				should(picker.columns[1].rows).be.an.Array;
				should(picker.columns[1].rows.length).be.eql(color.length);

				finish();
			}
			catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it('PlainPicker.add (PickerRow)', function(finish) {
		win = Ti.UI.createWindow({
			backgroundColor: '#000'
		});
		var picker = Ti.UI.createPicker({
			type: Ti.UI.PICKER_TYPE_PLAIN
		});

		win.add(picker);
		win.addEventListener('open', function() {
			try {
				var rows = [];
				for (var i = 0, ilen = fruit.length; i < ilen; i++) {
					rows.push(Ti.UI.createPickerRow({
						title: fruit[i], color: color[i], font: { fontSize: 24 },
					}));
				}
				picker.add(rows);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it('PlainPicker.removeRow', function(finish) {
		win = Ti.UI.createWindow({
			backgroundColor: '#000'
		});
		var picker = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_PLAIN
			}),
			column = Ti.UI.createPickerColumn(),
			row;
		for (var i = 0, ilen = fruit.length; i < ilen; i++) {
			row = Ti.UI.createPickerRow({
				title: fruit[i], color: color[i], font: { fontSize: 24 },
			});
			column.addRow(row);
		}
		picker.add(column);

		win.add(picker);
		win.addEventListener('open', function() {
			try {
				should(picker.columns.length).be.eql(1);
				should(picker.columns[0]).be.an.Object;
				should(picker.columns[0].rows).be.an.Array;
				should(picker.columns[0].rows.length).be.eql(fruit.length);

				picker.columns[0].removeRow(picker.columns[0].rows[0]);

				should(picker.columns.length).be.eql(1);
				should(picker.columns[0]).be.an.Object;
				should(picker.columns[0].rows).be.an.Array;
				should(picker.columns[0].rows.length).be.eql(fruit.length - 1);

				finish();
			} catch (err) {
				finish(err);
			}
		});
		win.open();
	});

	it('PlainPicker change event', function(finish) {
		this.timeout(3000);
		var win = Ti.UI.createWindow();
		var type2 = [];
		type2[0]= Ti.UI.createPickerRow({title: 'Row 1'});
		type2[1]= Ti.UI.createPickerRow({title: 'Row 2'});

		pickerType = Ti.UI.createPicker();
		win.add(pickerType);
		setTimeout(loadTypes, 1000);
		pickerType.selectionIndicator = true;
		pickerType.addEventListener('change', pickerChange);

		function loadTypes() {
			pickerType.add(type2);
			setTimeout(function() {
				pickerType.setSelectedRow(0, 1);
			}, 500);
		}

		function pickerChange(e){
			finish();
		}

		win.open();
	});
});
