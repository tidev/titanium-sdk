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
		//{name: "showPagingControl"},// remove comment after fixing TIMOB-15700
		{name: "removeView"},
		//{name: "showPagingControlAfterCreation"},// remove comment after fixing TIMOB-15700
		//{name: "heightProperty"},// remove comment after fixing TIMOB-15700
		//{name: "scrollingEnabled"}// remove comment after fixing TIMOB-15700
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
		win.addEventListener('focus', function(){
				valueOf(testRun, scrollableView.showPagingControl).shouldBeFalse();
				finish(testRun);
		}); 
		win.open();	
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
		win.addEventListener('focus', function() {
			scrollableView.setShowPagingControl(true);
			valueOf(testRun, scrollableView.showPagingControl).shouldBeTrue();
			scrollableView.setShowPagingControl(false);
			valueOf(testRun, scrollableView.showPagingControl).shouldBeFalse();

			finish(testRun);
		});
		win.add(scrollableView);
		win.open();
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
		win.addEventListener('focus', function(){
			valueOf(testRun, ScrollableView.getHeight()).shouldBe('auto');

			finish(testRun);
		});
		win.open();
	}

	//TIMOB-9019
	this.scrollingEnabled = function(testRun) {
		var win = Ti.UI.createWindow({});
		var scrollableView = Ti.UI.createScrollableView({
			showPagingControl : true,
			width : 300,
			height : 430
		});
		win.add(scrollableView);
		win.addEventListener('focus', function(){
			scrollableView.scrollingEnabled = true;
			valueOf(testRun, scrollableView.scrollingEnabled).shouldBeTrue();
			scrollableView.scrollingEnabled = false;
			valueOf(testRun, scrollableView.scrollingEnabled).shouldBeFalse();

			finish(testRun);
		});
		win.open();
	}
}
