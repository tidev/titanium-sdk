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

describe('Titanium.UI.ListView', function () {
	var didFocus = false;
	this.timeout(6e4);

	beforeEach(function () {
		didFocus = false;
	});

	it.ios('Custom template with module view', function (finish) {
		var map = require('ti.map');
		var win = Ti.UI.createWindow({ backgroundColor: 'green' }),
			myTemplate = {
				childTemplates: [
					{
						type: 'View',
						module: map,
						bindId: 'myMap',
						properties: {}
					}
				]
			},
			listView = Ti.UI.createListView({
				templates: { 'template': myTemplate },
				defaultItemTemplate: 'template'
			}),
			sections = [],
			fruitSection,
			fruitDataSet,
			vegSection,
			vegDataSet;

		fruitSection = Ti.UI.createListSection();
		fruitDataSet = [
			{ myMap: { height: 100 } },
			{ myMap: { height: 150 } }
		];
		fruitSection.setItems(fruitDataSet);
		sections.push(fruitSection);

		vegSection = Ti.UI.createListSection();
		vegDataSet = [
			{ myMap: { height: 150 } },
			{ myMap: { height: 100 } }
		];
		vegSection.setItems(vegDataSet);
		sections.push(vegSection);

		listView.setSections(sections);

		win.addEventListener('focus', function () {
			var error;

			if (didFocus) {
				return;
			}
			didFocus = true;

			try {
				should(listView.sectionCount).be.eql(2);
				should(listView.sections[0].items.length).be.eql(2);
				should(listView.sections[0].items[0].myMap.height).be.eql(100);
				should(listView.sections[0].items[1].myMap.height).be.eql(150);

				should(listView.sections[1].items.length).be.eql(2);
				should(listView.sections[1].items[0].myMap.height).be.eql(150);
				should(listView.sections[1].items[1].myMap.height).be.eql(100);
			} catch (err) {
				error = err;
			}

			setTimeout(function () {
				win.close();
				finish(error);
			}, 1000);
		});

		win.add(listView);
		win.open();
	});
});
