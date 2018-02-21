/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';

describe('Ti.UI.TableView', function () {
	it('set and clear data', function (finish) {
		var data_a = [
				{ title: 'Square', backgroundSelectedColor: 'red' },
				{ title: 'Circle', backgroundSelectedColor: 'blue' },
				{ title: 'Triangle', backgroundSelectedColor: 'purple' }
			],
			data_b = [
				{ title: 'Red', backgroundSelectedColor: 'red' },
				{ title: 'Green', backgroundSelectedColor: 'green' },
				{ title: 'Blue', backgroundSelectedColor: 'blue' }
			],
			tv = Ti.UI.createTableView(),
			error;

		try {
			tv.data = [];
			tv.setData(data_a);
			tv.data = [];
			tv.setData(data_b);
			tv.data = [];
			tv.setData(data_a);
		} catch (e) {
			error = e;
		}
		finish(error);
	});
});
