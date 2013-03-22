/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

var isTizen = Ti.Platform.osname === 'tizen',
	isMobileWeb = Ti.Platform.osname === 'mobileweb';

(isTizen || isMobileWeb) && Ti.include('countPixels.js');

module.exports = new function() {
	var finish,
		valueOf,
		reportError;

	this.name = "button";
	this.tests = [
		{name: "basic_test"},
		{name: "test_events"},
		{name: "pixel_test"}
	];

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		reportError = testUtils.reportError;
	};

	// Test some button properties and functions
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


	// Test button events (all events are inherited)
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

	// Check view color on the screen
	this.pixel_test = function(testRun) {
		Ti.API.info("Start test pixel_test.");

		var buttonTitle = "&#9607;&#9607;&#9607",
			win = Ti.UI.createWindow({
				backgroundColor: "#FF0000",
				width: 300,
				height: 200
			}),
			button,
			countPixel;

		valueOf(testRun, function() {
			button = Ti.UI.createButton({
				title: buttonTitle,
				backgroundColor: '#00FF00',
				color: "#0000FF",
				top: 10,
				width: 100,
				height: 50
			});
		}).shouldNotThrowException();
		valueOf(testRun, button).shouldNotBeNull();
		valueOf(testRun, button).shouldBeObject();

        if (isTizen || isMobileWeb) {
        	Ti.API.info("Get CountPixels object.");

            valueOf(testRun, function() { countPixel = new CountPixels(); }).shouldNotThrowException();
            valueOf(testRun, countPixel).shouldBeObject();
        }

        win.addEventListener("postlayout", function() {
            if (isTizen || isMobileWeb) {
            	var onCompleteWithButton = function(count) {
   					valueOf(testRun, count).shouldBeGreaterThan(1000);

					setTimeout(function() {
						var onCompleteTextColor = function(newCount) {
							valueOf(testRun, newCount).shouldBeGreaterThan(0);
		            	};

		            	valueOf(testRun, function() { countPixel.countPixels([0, 0, 255], win, onCompleteTextColor); }).shouldNotThrowException();
	            	}, 1000);

					setTimeout(function() {
						var onCompleteWithoutButton = function(count) {
							valueOf(testRun, count).shouldBeEqual(0);

							Ti.API.info("Test pixel_test end.");
							
							win.close();
			    			finish(testRun);
		            	};

		            	valueOf(testRun, function() { win.remove(button); }).shouldNotThrowException();
		            	valueOf(testRun, function() { countPixel.countPixels([0, 255, 0], win, onCompleteWithoutButton); }).shouldNotThrowException();
	            	}, 3000);
            	};

            	valueOf(testRun, countPixel.countPixels).shouldBeFunction();
            	valueOf(testRun, function() { countPixel.countPixels([0, 255, 0], win, onCompleteWithButton); }).shouldNotThrowException();
            } else {
				Ti.API.info("Test pixel_test end.");

                win.close();
			    finish(testRun);
            }
        });

        win.add(button);
        win.open();
	}
}