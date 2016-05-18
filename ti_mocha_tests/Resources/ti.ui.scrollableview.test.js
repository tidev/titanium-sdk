/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./should');

describe("ui_scrollableView", function() {
	//TIMOB-5170
	it("showPagingControl", function(finish) {
		this.timeout(4000);
		var win = Ti.UI.createWindow({
			backgroundColor: "#c6c6c6"
		});
		var scrollableView = Ti.UI.createScrollableView({
			bottom: "50dp",
			left: "10dp",
			right: "10dp",
			top: "50dp"
		});
		win.add(scrollableView);
		win.open();
		setTimeout(function() {
			should(scrollableView.showPagingControl).be.false;
			finish();
		}, 2000);
	});
	//TIMOB-5990
	it.skip("removeView", function(finish) {
		should(function() {
			Ti.UI.createScrollableView({
				views: [ Ti.UI.createView() ]
			}).removeView(0);
		}).not.throw();
		finish();
	});
	//TIMOB-7127
	it("showPagingControlAfterCreation", function(finish) {
		this.timeout(4000);
		var win = Titanium.UI.createWindow({
			backgroundColor: "c6c6c6"
		});
		var scrollableView = Titanium.UI.createScrollableView({
			borderColor: "red",
			backgroundColor: "purple",
			width: 200,
			height: 200,
			pagingControlColor: "blue",
			pagingControlHeight: 20
		});
		win.add(scrollableView);
		win.open();
		setTimeout(function() {
			scrollableView.setShowPagingControl(true);
			should(scrollableView.showPagingControl).be.true;
			scrollableView.setShowPagingControl(false);
			should(scrollableView.showPagingControl).be.false;
			finish();
		}, 2000);
	});
	//TIMOB-7847
	it("heightProperty", function(finish) {
		this.timeout(4000);
		var win = Ti.UI.createWindow({
			background: "green"
		});
		var ScrollableView = Ti.UI.createScrollableView({
			showPagingControl: true,
			pagingControlHeight: 30,
			top: 50,
			left: 0,
			height: "auto"
		});
		win.add(ScrollableView);
		win.open();
		setTimeout(function() {
			should(ScrollableView.getHeight()).eql("auto");
			finish();
		}, 2000);
	});
});