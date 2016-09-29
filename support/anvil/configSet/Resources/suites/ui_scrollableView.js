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

	this.name = "ui_scrollableView";
	this.tests = [
		{name: "showPagingControl", timeout: 10000},
		{name: "removeView"},
		{name: "showPagingControlAfterCreation", timeout: 10000},
		{name: "heightProperty", timeout: 10000}
	]

	//TIMOB-5170
	this.showPagingControl = function(testRun) {
		var win = Ti.UI.createWindow({
			backgroundColor:'#c6c6c6'
		});
		var scrollableView = Ti.UI.createScrollableView({
			bottom : "50dp",
			left : "10dp",
			right : "10dp",
			top : "50dp"
		});
		win.add(scrollableView);
		win.open();	
		setTimeout(function() {
			valueOf(testRun, scrollableView.showPagingControl).shouldBeFalse();
			
			finish(testRun);
		}, 10000);
	}

	//TIMOB-5990
	this.removeView = function(testRun) {
		valueOf(testRun, function(){
			Ti.UI.createScrollableView({
				views: [ Ti.UI.createView() ]
			}).removeView(0);
		}).shouldNotThrowException();

		finish(testRun);
	}

	//TIMOB-7127
	this.showPagingControlAfterCreation = function(testRun) {
		var win = Titanium.UI.createWindow({
			backgroundColor: 'c6c6c6'
		});
		var scrollableView = Titanium.UI.createScrollableView({
			borderColor : 'red',
			backgroundColor : 'purple',
			width : 200,
			height : 200,
			pagingControlColor : 'blue',
			pagingControlHeight : 20
		});
		win.add(scrollableView);
		win.open();
		setTimeout(function() {
			scrollableView.setShowPagingControl(true);
			valueOf(testRun, scrollableView.showPagingControl).shouldBeTrue();
			scrollableView.setShowPagingControl(false);
			valueOf(testRun, scrollableView.showPagingControl).shouldBeFalse();

			finish(testRun);
		}, 10000);	
	}

	//TIMOB-7847
	this.heightProperty = function(testRun) {
		var win = Ti.UI.createWindow({
			background: 'green',
		});
		var ScrollableView = Ti.UI.createScrollableView({
			showPagingControl : true,
			pagingControlHeight : 30,
			top : 50,
			left : 0,
			height : 'auto'
		});
		win.add(ScrollableView);
		win.open();
		setTimeout(function() {
			valueOf(testRun, ScrollableView.getHeight()).shouldBe('auto');

			finish(testRun);
		}, 10000);
	}
}
