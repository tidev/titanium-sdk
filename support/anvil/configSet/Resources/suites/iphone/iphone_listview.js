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

	this.name = "iphone_listview";
	this.tests = [
		{name: "listviewProperties"}
	]

	//TIMOB-13419
	this.listviewProperties = function(testRun) {
		var win = Ti.UI.createWindow({backgroundColor: 'white'});
		var search = Titanium.UI.createSearchBar({
			showCancel:true,
		});
		var listView = Ti.UI.createListView({
			searchView :search,
			keepSectionsInSearch:true,
		});
		var sections = [];
		var fruitSection = Ti.UI.createListSection({ headerTitle: 'Fruits'});
		var fruitDataSet = [
			{properties: { title: 'Apple'}},
			{properties: { title: 'Banana'}},
		];
		fruitSection.setItems(fruitDataSet);
		sections.push(fruitSection);
		listView.sections = sections;
		win.add(listView);
		win.open();
		setTimeout(function(){
			valueOf(testRun, listView.searchView).shouldBeObject();
			valueOf(testRun, listView.keepSectionsInSearch).shouldBeTrue();

			finish(testRun);
		},3000);
	}
}