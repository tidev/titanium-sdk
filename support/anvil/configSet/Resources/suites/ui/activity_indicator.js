/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

var isTizen = Ti.Platform.osname === 'tizen',
	isMobileWeb = Ti.Platform.osname === 'mobileweb',
	isIOS = Ti.Platform.name === 'iPhone OS';

if (isTizen || isMobileWeb) {
	Ti.include('countPixels.js');
}

module.exports = new function() {
	var finish,
		valueOf;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "activity_indicator";
	this.tests = (function() {
		var arr = [
			{name: "testProperties"},
		];

		if (isTizen || isMobileWeb) {
			arr.push({name: "testProgress"});
		}

		return arr;
	}());

	this.testProperties = function(testRun) {	
		var wind = Ti.UI.createWindow({
				backgroundColor :'#660000'
			}),
			style = Ti.UI.ActivityIndicatorStyle.DARK;

		if (isIOS) {
			style = Ti.UI.iPhone.ActivityIndicatorStyle.DARK;
		}

		var activityIndicator = Ti.UI.createActivityIndicator({
			color: 'green',
			font: {fontFamily: 'Helvetica Neue', fontSize: 26, fontWeight: 'bold'},
			message: 'Loading...',
			style: style,
			top: 10,
			left: 10,
			height: Ti.UI.SIZE,
			width: Ti.UI.SIZE
		});
		
		wind.add(activityIndicator);

		activityIndicator.show();

		valueOf(testRun, activityIndicator.color).shouldBe('green');
		valueOf(testRun, activityIndicator.left).shouldBe(10);
		valueOf(testRun, activityIndicator.top).shouldBe(10);
		valueOf(testRun, activityIndicator.height).shouldBe(Ti.UI.SIZE);
		valueOf(testRun, activityIndicator.width).shouldBe(Ti.UI.SIZE);
		valueOf(testRun, activityIndicator.message).shouldBe('Loading...');
		valueOf(testRun, activityIndicator.font).shouldBeObject();
		valueOf(testRun, activityIndicator.font.fontSize).shouldBe('26px');
		valueOf(testRun, activityIndicator.font.fontWeight).shouldBe('bold');

		finish(testRun);
	}

	this.testProgress = function(testRun) {
		// Verify that the activity indicator indeed appears
		var wind = Ti.UI.createWindow(),
			cp = new CountPixels(),
			activityIndicator = Ti.UI.createActivityIndicator({
				color: '#00ff00',		// color value will be checked later
				indicatorColor: '#ff0000',// indicatorColor value will be checked later
				indicatorDiameter: '40',   //this value will be checked with using comparing count of colored pixel with one in greater indicator;
				backgroundColor: '#00ffff',
				font: {fontFamily:'Helvetica Neue', fontSize:26, fontWeight:'bold'},
				message: 'Loading...',
				top: 10,
				left: 10,
				height: Ti.UI.SIZE,
				width: Ti.UI.SIZE
			});

		// Postlayout is triggered here for the first time.
		var expectCount = 30;

		// Function is designed to be called twice, after each cycle
		// began by postlayout handler.
		var fin = (function() {
			// Whether this is the first or the second run
			var repeat = true;

			return function(count) {
				if (repeat) {
					repeat = false;
					
					activityIndicator.applyProperties({
						indicatorDiameter: '60'
					});

					// At this point, postlayout is triggered for the second time
					// (because activity indicator changed its appearance) and the whole cycle begins again.
				} else {
					wind.close();
				} 
			}
		}());

		activityIndicator.addEventListener('postlayout', function(){
			// The activity indicator should now be drawn. Check if it is
			// (criteria: there must be enough pixels of the foreground color)
			setTimeout(function() {
				cp.countPixels([0, 255, 0], wind, checkFontColor);
			}, 500)
		});

		function checkFontColor(count) {
			valueOf(testRun, count).shouldBeGreaterThan(250);
			cp.countPixels([0, 255, 255], wind, checkBackColor);
		}
		
		function checkBackColor(count) {
			valueOf(testRun, count).shouldBeGreaterThan(2000);
			checkIndicatorColor();
		}

		function checkIndicatorColor() {
			cp.countPixels([255, 0, 0], wind, function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(expectCount);
				// Remember the current count of red pixels to compare it with
				// the count when the diameter is bigger.
				expectcount = count;
				fin();
			});
		}

		function progress() {
			activityIndicator.show();
		};

		wind.add(activityIndicator);
		wind.addEventListener('postlayout', progress);
		wind.addEventListener('close', function() {
			finish(testRun);
		})

		wind.open();
	}
}