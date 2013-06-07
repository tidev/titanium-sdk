/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

// Simple tests of Ti.UI.Button.

module.exports = new function() {
	var finish,
		valueOf,
		reportError;

	this.name = "button";
	this.tests = [
		{name: "basic_test"},
		{name: "test_events"}
	];

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		reportError = testUtils.reportError;
	};

	// Verifies if basic button properties and functions have the correct type and are sane
	this.basic_test = function(testRun) {
		Ti.API.info("Test basic_test start.");

		var buttonTitle = "ButtonTitle",
			win = Ti.UI.createWindow({
				backgroundColor: "#FFFFF0",
				width: 300,
				height: 200
			}),
			button,
			label = Ti.UI.createLabel({
				text: "LabelTitle",
				top: 10
			});

		valueOf(testRun, function() {
			button = Ti.UI.createButton({
				title: buttonTitle,
				top: 10,
				width: 100,
				height: 50
			});
		}).shouldNotThrowException();

		valueOf(testRun, button).shouldNotBeNull();
		valueOf(testRun, button).shouldBeObject();
		valueOf(testRun, button.color).shouldBeUndefined();		
		valueOf(testRun, button.font).shouldBeUndefined();
		valueOf(testRun, button.image).shouldBeUndefined();
		valueOf(testRun, button.title).shouldBeEqual(buttonTitle);
		valueOf(testRun, button.titleid).shouldBeUndefined();
		valueOf(testRun, button.add).shouldBeFunction();
        valueOf(testRun, function() { button.color = "#123456"; }).shouldNotThrowException();
        valueOf(testRun, button.color).shouldBeEqual("#123456");
        valueOf(testRun, function() { button.setTop(30); }).shouldNotThrowException();
        valueOf(testRun, function() { button.verticalAlign = 10; }).shouldNotThrowException();
        valueOf(testRun, function() { button.add(label); }).shouldNotThrowException();

        win.addEventListener("postlayout", function() {
        	Ti.API.info("Test basic_test end.");

			win.close();
            finish(testRun);
        });

        win.add(button);
        win.open();
	}

	// Test button events. Events are simulated using "fireEvent".
	this.test_events = function(testRun) {
		Ti.API.info("Start test test_events.");

		var buttonTitle = "ButtonTitle",
			click = false,
			dblclick = false,
			longclick = false,
			longpress = false,
			pinch = false,
			win = Ti.UI.createWindow({
				backgroundColor: "#FFFFF0",
				width: 300,
				height: 200
			}),
			button = Ti.UI.createButton({
				title: buttonTitle,
				top: 10,
				width: 100,
				height: 50
			});

		valueOf(testRun, function() {
			button.addEventListener("click", function() {
				Ti.API.info("Click event fired.");

				click = true;
			});
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			button.addEventListener("dblclick", function() {
				Ti.API.info("Dblclick event fired.");

				dblclick = true;
			});
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			button.addEventListener("longclick", function() {
				Ti.API.info("Longclick event fired.");

				longclick = true;
			});
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			button.addEventListener("longpress", function() {
				Ti.API.info("Longpress event fired.");

				longpress = true;
			});
		}).shouldNotThrowException();

		valueOf(testRun, function() {
			button.addEventListener("pinch", function() {
				Ti.API.info("Pinch event fired.");

				pinch = true;
			});
		}).shouldNotThrowException();

		win.addEventListener("postlayout", function() {
			button.fireEvent("click");
			button.fireEvent("dblclick");
			button.fireEvent("longclick");
			button.fireEvent("longpress");
			button.fireEvent("pinch");
		});

		win.add(button);
		win.open();

		setTimeout(function() {
			Ti.API.info("Start to check event values.");

			valueOf(testRun, click).shouldBeTrue();
			valueOf(testRun, dblclick).shouldBeTrue();
			valueOf(testRun, longpress).shouldBeTrue();
			valueOf(testRun, longclick).shouldBeTrue();
			valueOf(testRun, pinch).shouldBeTrue();

			Ti.API.info("All values are fine. Finish test.");
			
			win.close();
			finish(testRun);
		}, 2000);
	}
}