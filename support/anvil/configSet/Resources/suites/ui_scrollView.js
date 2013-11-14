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

	this.name = "ui_scrollView";
	this.tests = [
		{name: "removeMethod"},
		{name: "scrollToBottom"},
		{name: "scrollingEnabled"}
	]

	//TIMOB-3378, TIMOB-10110
	this.removeMethod = function(testRun) {
		var win = Titanium.UI.createWindow({
			title :'Scrollview test window',
			backgroundColor :'#fff'
		});
		var scrollview = Ti.UI.createScrollView({
			layout : 'vertical'
		});
		var view = Ti.UI.createView({
			height : 20,
			width : 20,
			backgroundColor :'red',
			borderColor : 'gray',
			borderWidth : 4,
		});
		scrollview.add(view);
		win.addEventListener('open', function() { //after fixing https://jira.appcelerator.org/browse/TIMOB-15700 change to focus event
			valueOf(testRun, scrollview.getChildren( )).shouldBeObject();
			valueOf(testRun, scrollview.getChildren( )[0].height).shouldBe(20);
			scrollview.remove(view);
			valueOf(testRun, function() {
				var height=scrollview.getChildren( )[0].height;
			}).shouldThrowException();
			
			finish(testRun);
		});
		win.add(scrollview);
		win.open();
	}

	//TIMOB-8499, TIMOB-11331
	this.scrollToBottom = function(testRun) {
		var win = Ti.UI.createWindow({
			backgroundColor : '#fff'
		});
		var scroll = Ti.UI.createScrollView({
			contentHeight : '2000',
			scrollType : 'vertical'
		});
		win.add(scroll);
		win.addEventListener('open', function () {//after fixing https://jira.appcelerator.org/browse/TIMOB-15700 change to focus event
			valueOf(testRun, function() {
				scroll.scrollToBottom();
			}).shouldNotThrowException
			
			finish(testRun);
		});
		win.open();
	}

	//TIMOB-9907
	this.scrollingEnabled = function(testRun) {
		var win = Ti.UI.createWindow({
			backgroundColor : '#fff'
		});
		var scroll = Ti.UI.createScrollView({
			contentHeight : '2000',
			scrollType : 'vertical',
			scrollingEnabled : false
		});
		win.add(scroll);
		win.addEventListener('open', function() {//after fixing https://jira.appcelerator.org/browse/TIMOB-15700 change to focus event
			valueOf(testRun, scroll.scrollingEnabled).shouldBeFalse();
			scroll.scrollingEnabled = true;
			valueOf(testRun, scroll.scrollingEnabled).shouldBeTrue();

			finish(testRun);
		});
		win.open();
	}
}
