/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

var isTizen = Ti.Platform.osname === 'tizen',
	isMobileWeb = Ti.Platform.osname === 'mobileweb';

(isTizen || isMobileWeb) && Ti.include('countPixels.js');

module.exports = new function() {
	var finish,
		valueOf;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "progress_bar";
	this.tests = (function() {
		var arr = [
			{name: "testProperties"}
		];

		(isTizen || isMobileWeb) && (arr.push({name: "testProgress"}));

		return arr;
	}());

	this.testProperties = function(testRun) {
		var wind = Ti.UI.createWindow(),
			pb = Titanium.UI.createProgressBar({
				top: 10,
				width: 250,
				height: 'auto',
				min: 0,
				max: 10,
				value: 0,
				color: '#fff',
				message: 'Downloading 0 of 10',
				font: {fontSize:14, fontWeight:'bold'},
			});

		wind.add(pb);

		pb.show();

		valueOf(testRun, pb.color).shouldBe('#fff');
		valueOf(testRun, pb.max).shouldBe(10);
		valueOf(testRun, pb.min).shouldBe(0);
		valueOf(testRun, pb.value).shouldBe(0);
		valueOf(testRun, pb.message).shouldBe('Downloading 0 of 10');
		valueOf(testRun, pb.font).shouldBeObject();
		valueOf(testRun, pb.font.fontSize).shouldBe('14px');
		valueOf(testRun, pb.font.fontWeight).shouldBe('bold');

		finish(testRun);
	}

	this.testProgress = function(testRun) {
		var wind = Ti.UI.createWindow(),		
			pb = Titanium.UI.createProgressBar({
				top: 10,
				width: 250,
				height: 'auto',
				min: 0,
				max: 10,
				value: 0,
				color: '#ff0000',
				message: 'Downloading 0 of 10',
				font: {fontSize:14, fontWeight:'bold'},
			});

		wind.add(pb);

		var cp = new CountPixels(),
			prev_count = -1;

		// Verify the operation of the progress bar by incrementing its value in a loop and checking
		// (by counting pixels of foreground colour) that the progress section is increasing.
		function start() {
			pb.show();

			valueOf(testRun, pb.value).shouldBe(0);
			cp.countPixels([204, 204, 204], wind, progress);
		};

		// Progress incrementation loop
		function progress(count) {
			Ti.API.info(count);

			if (pb.value < pb.max) {
				pb.value++;
				valueOf(testRun, count).shouldBeGreaterThan(prev_count);
				prev_count = count;
				
				setTimeout(function() {
					cp.countPixels([204, 204, 204], wind, progress);
				},100);
			} else {
				checkValue();
			}
		};

		function checkValue() {
			valueOf(testRun, pb.value).shouldBe(pb.max);
			wind.close();
			finish(testRun); 
		};

		wind.addEventListener('postlayout', start);
		wind.open();
	}
}