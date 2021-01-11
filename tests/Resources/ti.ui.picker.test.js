/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions');

describe('Titanium.UI.Picker', function () {
	const fruit = [ 'Bananas', 'Strawberries', 'Mangos', 'Grapes' ];
	const color = [ 'red', 'green', 'blue', 'orange', 'red', 'green', 'blue', 'orange' ];

	this.timeout(10000);

	let win;
	afterEach(done => { // fires after every test in sub-suites too...
		if (win && !win.closed) {
			win.addEventListener('close', function listener () {
				win.removeEventListener('close', listener);
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	describe('.type is PICKER_TYPE_DATE', () => {
		it('lifecycle', function (finish) {
			const date = new Date();
			const picker = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_DATE,
				value: date
			});

			win = Ti.UI.createWindow({
				backgroundColor: '#000'
			});
			win.add(picker);
			win.addEventListener('open', function () {
				try {
					should(picker.value).be.eql(date);
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.open();
		});

		it.ios('.dateTimeColor (invalid "type" - TIMOB-28181)', function (finish) {
			const dp = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_PLAIN,
				dateTimeColor: 'red'
			});

			win = Ti.UI.createWindow();
			win.addEventListener('open', function () {
				try {
					should(dp.dateTimeColor).be.eql('red');
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.add(dp);
			win.open();
		});

		it.ios('.dateTimeColor (valid "type" + "datePickerStyle" - TIMOB-28181)', function (finish) {
			const dp = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_DATE,
				datePickerStyle: Ti.UI.iOS.DATE_PICKER_STYLE_WHEELS,
				dateTimeColor: 'red'
			});

			win = Ti.UI.createWindow();
			win.addEventListener('open', function () {
				try {
					should(dp.dateTimeColor).be.eql('red');
					finish();
				} catch (err) {
					return finish(err);
				}
			});
			win.add(dp);
			win.open();
		});

		it('.minDate', function (finish) {
			const dp = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_DATE
			});
			const date = new Date(2018, 1, 1);
			dp.minDate = date;

			win = Ti.UI.createWindow({ title: 'Form' });
			win.addEventListener('open', function () {
				try {
					should(dp.minDate).be.eql(date);
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.add(dp);
			win.open();
		});

		it('.maxDate', function (finish) {
			const dp = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_DATE
			});
			const date = new Date(2020, 1, 20);
			dp.maxDate = date;

			win = Ti.UI.createWindow({ title: 'Form' });
			win.addEventListener('open', function () {
				try {
					should(dp.maxDate).be.eql(date);
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.add(dp);
			win.open();
		});

		it('.minDate/maxDate - change after open', (finish) => {
			let minDate = new Date(2020, 4, 1);
			let maxDate = new Date(2020, 6, 31);
			const picker = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_DATE,
				minDate: minDate,
				maxDate: maxDate,
				value: new Date(2020, 5, 1)
			});

			win = Ti.UI.createWindow();
			win.addEventListener('open', () => {
				try {
					should(picker.minDate).be.eql(minDate);
					should(picker.maxDate).be.eql(maxDate);
					should(picker.value.getTime()).be.aboveOrEqual(minDate.getTime());
					should(picker.value.getTime()).be.belowOrEqual(maxDate.getTime());
					minDate = new Date(2018, 0, 1);
					maxDate = new Date(2018, 2, 31);
					picker.minDate = minDate;
					picker.maxDate = maxDate;
					picker.value = new Date(2018, 1, 1); // Used to crash Android after changing range.
				} catch (err) {
					return finish(err);
				}

				setTimeout(() => {
					try {
						should(picker.minDate).be.eql(minDate);
						should(picker.maxDate).be.eql(maxDate);
						should(picker.value.getTime()).be.aboveOrEqual(minDate.getTime());
						should(picker.value.getTime()).be.belowOrEqual(maxDate.getTime());
					} catch (err) {
						return finish(err);
					}

					finish();
				}, 1);
			});
			win.add(picker);
			win.open();
		});

		describe('events', () => {
			it('postlayout', function (finish) {
				const dp = Ti.UI.createPicker({
					type: Ti.UI.PICKER_TYPE_DATE
				});

				win = Ti.UI.createWindow({ title: 'Form' });
				dp.addEventListener('postlayout', function postlayout() {
					dp.removeEventListener('postlayout', postlayout);
					finish();
				});
				win.add(dp);
				win.open();
			});
		});
	});

	describe('.type is PICKER_TYPE_TIME', () => {
		it('TimePicker', function (finish) {
			const date = new Date();
			const picker = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_TIME,
				value: date
			});

			win = Ti.UI.createWindow({
				backgroundColor: '#000'
			});
			win.add(picker);
			win.addEventListener('open', function () {
				try {
					should(picker.value.getHours()).be.eql(date.getHours());
					should(picker.value.getMinutes()).be.eql(date.getMinutes());
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.open();
		});
	});

	describe('.type is PICKER_TYPE_PLAIN', () => {
		it('open and log value', function (finish) {
			const picker = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_PLAIN
			});

			win = Ti.UI.createWindow({
				backgroundColor: '#000'
			});
			win.add(picker);
			win.addEventListener('open', function () {
				try {
					should(picker).be.an.Object();
					console.log(picker.value);
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.open();
		});

		it('#add(PickerColumn)', function (finish) {
			const picker = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_PLAIN
			});

			win = Ti.UI.createWindow({
				backgroundColor: '#000'
			});
			win.add(picker);
			win.addEventListener('open', function () {
				try {
					const column = Ti.UI.createPickerColumn();
					for (let i = 0, ilen = fruit.length; i < ilen; i++) {
						const row = Ti.UI.createPickerRow({
							title: fruit[i], color: color[i], font: { fontSize: 24 },
						});
						column.addRow(row);
					}
					picker.add(column);

					should(picker.columns.length).be.eql(1);
					should(picker.columns[0]).be.an.Object();
					should(picker.columns[0].rows).be.an.Array();
					should(picker.columns[0].rows.length).be.eql(fruit.length);
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.open();
		});

		it('#add(multiple PickerColumn)', function (finish) {
			const picker = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_PLAIN
			});

			win = Ti.UI.createWindow({
				backgroundColor: '#000'
			});
			win.add(picker);
			win.addEventListener('open', function () {
				try {
					const column1 = Ti.UI.createPickerColumn();
					for (let i = 0, ilen = fruit.length; i < ilen; i++) {
						const row = Ti.UI.createPickerRow({
							title: fruit[i], color: color[i], font: { fontSize: 24 },
						});
						column1.addRow(row);
					}

					const column2 = Ti.UI.createPickerColumn();
					for (let i = 0, ilen = color.length; i < ilen; i++) {
						const row = Ti.UI.createPickerRow({
							title: color[i]
						});
						column2.addRow(row);
					}

					picker.add([ column1, column2 ]);

					should(picker.columns.length).be.eql(2);
					should(picker.columns[0]).be.an.Object();
					should(picker.columns[0].rows).be.an.Array();
					should(picker.columns[0].rows.length).be.eql(fruit.length);

					should(picker.columns[1]).be.an.Object();
					should(picker.columns[1].rows).be.an.Array();
					should(picker.columns[1].rows.length).be.eql(color.length);
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.open();
		});

		it('#add(PickerRow)', function (finish) {
			const picker = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_PLAIN
			});

			win = Ti.UI.createWindow({
				backgroundColor: '#000'
			});
			win.add(picker);
			win.addEventListener('open', function () {
				try {
					const rows = [];
					for (let i = 0, ilen = fruit.length; i < ilen; i++) {
						rows.push(Ti.UI.createPickerRow({
							title: fruit[i], color: color[i], font: { fontSize: 24 },
						}));
					}
					picker.add(rows);
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.open();
		});

		it('#removeRow()', function (finish) {
			const picker = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_PLAIN
			});
			const column = Ti.UI.createPickerColumn();
			for (let i = 0, ilen = fruit.length; i < ilen; i++) {
				const row = Ti.UI.createPickerRow({
					title: fruit[i], color: color[i], font: { fontSize: 24 },
				});
				column.addRow(row);
			}
			picker.add(column);

			win = Ti.UI.createWindow({
				backgroundColor: '#000'
			});
			win.add(picker);
			win.addEventListener('open', function () {
				try {
					should(picker.columns.length).be.eql(1);
					should(picker.columns[0]).be.an.Object();
					should(picker.columns[0].rows).be.an.Array();
					should(picker.columns[0].rows.length).be.eql(fruit.length);

					picker.columns[0].removeRow(picker.columns[0].rows[0]);

					should(picker.columns.length).be.eql(1);
					should(picker.columns[0]).be.an.Object();
					should(picker.columns[0].rows).be.an.Array();
					should(picker.columns[0].rows.length).be.eql(fruit.length - 1);
				} catch (err) {
					return finish(err);
				}
				finish();
			});
			win.open();
		});

		describe('events', () => {
			it('change', function (finish) {
				const pickerType = Ti.UI.createPicker();

				const type2 = [
					Ti.UI.createPickerRow({ title: 'Row 1' }),
					Ti.UI.createPickerRow({ title: 'Row 2' }),
				];

				win = Ti.UI.createWindow();
				win.add(pickerType);
				pickerType.addEventListener('postlayout', loadTypes);
				pickerType.selectionIndicator = true;
				pickerType.addEventListener('change', () => finish());

				function loadTypes() {
					pickerType.removeEventListener('postlayout', loadTypes);
					pickerType.add(type2);
					pickerType.setSelectedRow(0, 1);
				}

				win.open();
			});
		});
	});

	it.android('Selected index persistance', function (finish) {
		// workaround iOS triggering of 'postlayout' event
		const containerView = Ti.UI.createView();
		const picker = Ti.UI.createPicker({});
		const rows = [];
		const indexToTest = 2;

		for (let index = 0; index < 5; index++) {
			rows.push(Ti.UI.createPickerRow({ title: 'Item ' + (index + 1).toString() }));
		}

		picker.add(rows);

		win = Ti.UI.createWindow();
		win.add(picker);

		picker.addEventListener('change', function () {
			win.remove(picker);
			containerView.addEventListener('postlayout', finishTest);
			containerView.add(picker);
			win.add(containerView);
		});

		picker.addEventListener('postlayout', changeItem);

		win.open();

		function changeItem() {
			picker.removeEventListener('postlayout', changeItem);
			picker.setSelectedRow(0, indexToTest);
		}

		function finishTest() {
			if (rows.indexOf(picker.getSelectedRow(0)) === indexToTest) {
				finish();
			}
		}
	});
});
