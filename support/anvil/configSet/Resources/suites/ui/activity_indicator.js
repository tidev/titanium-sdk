/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

module.exports = new function() {
	var finish,
		valueOf;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "activity_indicator";
	this.tests = [
		{name: "testProperties"}
	];

	this.testProperties = function(testRun) {	
		var wind = Ti.UI.createWindow({
				backgroundColor :'#660000'
			}),
			style = Ti.UI.ActivityIndicatorStyle.DARK;

		if (Ti.Platform.name === 'iPhone OS') {
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
}