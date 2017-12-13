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
var should = require('./utilities/assertions');

describe('Titanium.UI.SearchBar', function () {
	it.ios('Should work with absolute-positioned search-bars (ListView)', function (finish) {
		var data = [ { properties: { title : 'Bashful', hasDetail: true } }];
 
		var win = Ti.UI.createWindow( {
			backgroundColor : 'white'
		});
		
		win.addEventListener('open', function () {
			should(listView.top).eql(50);
			should(listView.bottom).eql(50);
			should(listView.left).eql(40);
			should(listView.right).eql(40);

			should(searchBar.getWidth()).eql(150);

			setTimeout(function () {
				win.close();
				finish();
			}, 1000);
		});

		var searchBar = Ti.UI.createSearchBar( {
			width : 150
		});

		var listView = Ti.UI.createListView( {
		    	backgroundColor : '#999',
		    	searchView : searchBar,
		    	sections : [Ti.UI.createListSection({items: data})],
		    	top : 50,
		    	bottom : 50,
		    	left : 40,
		    	right : 40
		});
		win.add(listView);
		win.open();
	});
});
