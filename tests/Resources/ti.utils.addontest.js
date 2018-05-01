/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('Titanium.Utils', function () {
	it('JSON serialization (TIMOB-25785)', function (finish) {
		var validObject, validArray, invalidObject, invalidArray;
		this.timeout = 10000;

		validObject = {
			nl: null,
			num: 123,
			str: 'tirocks',
			arr: [ null, 123, 'tirocks', { num: 123, str: 'tirocks' } ],
			obj: {
				nl: null,
				num: 321,
				str: 'skcorit'
			}
		};

		validArray = [ null, 123, 'tirocks', { nl: null, num: 123, str: 'tirocks' }, [ null, 123, 'tirocks', { num: 123, str: 'tirocks' } ] ];

		invalidObject = {
			tiGesture: Ti.Gesture,
			proxy: Ti.UI.createLabel({ text: 'Whoops' }),
			num: 123,
			str: 'tirocks',
			arr: [ 123, 'tirocks', { num: 123, str: 'tirocks' } ],
			obj: {
				num: 321,
				str: 'skcorit'
			}
		};

		invalidArray = [ Ti.Gesture, Ti.UI.createLabel({ text: 'Whoops' }), 123, 'tirocks', { num: 123, str: 'tirocks' }, [ 123, 'tirocks', { num: 123, str: 'tirocks' } ] ];

		Ti.App.addEventListener('test1', function (e) {
			var obj = e.obj;

			should(obj).be.an.Object;
			should(obj.nl).be.null;
			should(obj.num).eql(123);
			should(obj.str).eql('tirocks');
			should(obj.arr).be.an.Array;
			should(obj.arr[0]).be.null;
			should(obj.arr[1]).eql(123);
			should(obj.arr[2]).eql('tirocks');
			should(obj.arr[3]).be.an.Object;
			should(obj.arr[3].num).eql(123);
			should(obj.arr[3].str).eql('tirocks');
			should(obj.obj).be.an.Object;
			should(obj.obj.nl).be.null;
			should(obj.obj.num).eql(321);
			should(obj.obj.str).eql('skcorit');

			Ti.App.fireEvent('test2', { arr: validArray });
		});

		Ti.App.addEventListener('test2', function (e) {
			var arr = e.arr;
			should(arr).be.an.Array;
			// TODO: Write more tests
			Ti.App.fireEvent('test3', { obj: invalidObject });
		});

		Ti.App.addEventListener('test3', function (e) {
			var obj = e.obj;
			should(obj).be.an.Object;
			// TODO: Write more tests
			Ti.App.fireEvent('test4', { arr: invalidArray });
		});

		Ti.App.addEventListener('test4', function (e) {
			var arr = e.arr;
			should(arr).be.an.Array;
			// TODO: Write more tests
			finish();
		});

		Ti.App.fireEvent('test1', { obj: validObject });
	});
});
