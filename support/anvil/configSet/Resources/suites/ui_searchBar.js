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
	
	this.name = "ui_searchBar";
	this.tests = [
		{name: "ui_searchBar"},
		{name: "showBookmark"}
	]
	
	//TIMOB-9745,TIMOB-7020
	this.ui_searchBar = function(testRun) {
		var win = Ti.UI.createWindow();
		var data = [{
			title : 'Row 1',
			color : 'red',
			},
			{
			title : 'Row 2',
			color : 'green'
			}
		];
		var sb = Titanium.UI.createSearchBar({
			barColor : 'blue',
			showCancel : false,
			height : 44
		});
		var table = Ti.UI.createTableView({
			height : 600,
			width : '100%',
			search : sb,
			top : 75,
			left : 0,
			data : data
		});
		win.addEventListener("open", function(){
			valueOf(testRun,function(){
				win.add(table);
			}).shouldNotThrowException();
			valueOf(testRun,function(){
				win.remove(table);
			}).shouldNotThrowException();
			valueOf(testRun,function(){
				win.add(table);
			}).shouldNotThrowException();
			valueOf(testRun,sb.getHeight()).shouldBe(44);
			valueOf(testRun,sb.getShowCancel()).shouldBeFalse();
			valueOf(testRun,sb.getBarColor()).shouldBe("blue");
			
		finish(testRun);
		})
		win.open();
	}
	
	//TIMOB-3223
	this.showBookmark = function(testRun) {
		var window = Titanium.UI.createWindow();
		var searchBar = Titanium.UI.createSearchBar({
			height: 44,
			showBookmark:true
		});
		window.addEventListener("focus",function(){
			if (Ti.UI.iOS){
				valueOf(testRun,searchBar.getHeight()).shouldBe(44);
				valueOf(testRun,searchBar.getShowBookmark()).shouldBeTrue();
			}
			finish(testRun);
		})
		window.add(searchBar);
		window.open();
	}
}