/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.UI.Picker', function () {
	var win;

	this.timeout(10000);

	afterEach(function (done) {
		if (win) {
			// If `win` is already closed, we're done.
			let t = setTimeout(function () {
				if (win) {
					win = null;
					done();
				}
			}, 3000);

			win.addEventListener('close', function listener () {
				clearTimeout(t);

				if (win) {
					win.removeEventListener('close', listener);
				}
				win = null;
				done();
			});
			win.close();
		} else {
			win = null;
			done();
		}
	});

	it('minDate/maxDate - change after open', (finish) => {
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
				finish(err);
			}

			setTimeout(() => {
				try {
					should(picker.minDate).be.eql(minDate);
					should(picker.maxDate).be.eql(maxDate);
					should(picker.value.getTime()).be.aboveOrEqual(minDate.getTime());
					should(picker.value.getTime()).be.belowOrEqual(maxDate.getTime());
					finish();
				} catch (err) {
					finish(err);
				}
			}, 1);
		});
		win.add(picker);
		win.open();
	});
});
