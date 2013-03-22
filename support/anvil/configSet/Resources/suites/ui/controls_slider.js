/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

module.exports = new function() {
	var finish,
		valueOf,
		reportError;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
		reportError = testUtils.reportError;
	}

	this.name = "controls_slider";
	this.tests = [
		{name: "sliderBasic"},
		{name: "sliderEvents"},
		{name: "sliderMinMaxRange"}
	];

	function createTestSlider() {
		var win = Ti.UI.createWindow(),
			slider = Ti.UI.createSlider({
				top: 50,
				min: 0,
				max: 100,
				width: 200,
				value: 50
			});

		win.add(slider);
		win.open();

		return slider;
	}

	this.sliderBasic = function(testRun) {
		var testSlider = Ti.UI.createSlider();

		valueOf(testRun, Ti.UI.createSlider).shouldBeFunction();		
		valueOf(testRun, testSlider).shouldBeObject();
		
		finish(testRun);
	}

	this.sliderEvents = function(testRun) {
		var valueChangedEventFiresCount = 0;
		var valueChangedEventTargetValue = 77;
		var slider = createTestSlider();

		slider.addEventListener("change", function(e) {
			Ti.API.debug("OnChange event fired.");
			valueChangedEventFiresCount++;
			valueOf(testRun, e.value).shouldBe(valueChangedEventTargetValue);
		});

		// Run tests
		setTimeout(function () {
			slider.value = valueChangedEventTargetValue;

			setTimeout(function () {
				valueOf(testRun, valueChangedEventFiresCount).shouldBe(1);
				finish(testRun);
			}, 1000);
		}, 1000);
	}

	this.sliderMinMaxRange = function(testRun) {
		var slider = createTestSlider();

		valueOf(testRun, slider.enabled).shouldBe(true);
		slider.enabled = false;
		valueOf(testRun, slider.enabled).shouldBe(false);
		slider.enabled = true;
		valueOf(testRun, slider.enabled).shouldBe(true);

		slider.min = 99;
		slider.max = 199

		slider.value = Math.pow(2,53);
		valueOf(testRun, slider.value ).shouldBe(199);

		slider.value = -99;
		valueOf(testRun, slider.value ).shouldBe(99);

		// Not for iPhone!
		if (Ti.Platform.osname != "iphone" && Ti.Platform.osname != "ipad" ) {
			slider.minRange = 150;
			slider.maxRange = 160;

			slider.value = 165;
			valueOf(testRun, slider.value ).shouldBe(160);

			slider.value = 200;
			valueOf(testRun, slider.value ).shouldBe(160);

			slider.value = 65;
			valueOf(testRun, slider.value ).shouldBe(150);

			slider.value = 140;
			valueOf(testRun, slider.value ).shouldBe(150);

			slider.value = 155;
			valueOf(testRun, slider.value ).shouldBe(155);
		}

		finish(testRun);
	}
}