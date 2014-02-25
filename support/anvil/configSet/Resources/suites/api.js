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

	this.name = "api";
	this.tests = [
		{name: "apiTimeStamp"},
		{name: "loggingArray"},
		{name: "adhocProperties"}
	]

	//TIMOB-11537
	this.apiTimeStamp = function(testRun) {
		if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
			valueOf(testRun, function() {
				Titanium.API.timestamp('Titanium.API.timestamp');
			}).shouldNotThrowException();
		}
		finish(testRun);
	}

	//TIMOB-7624
	this.loggingArray = function(testRun) {
		valueOf(testRun, function() {
			Ti.API.info('yo', 'word');
			Ti.API.debug('durp');
			Ti.API.warn('foo', 'bar', 'baz');
			Ti.API.log('level', 'message', 'goes', 'here');
			Ti.API.info();
		}).shouldNotThrowException();

		finish(testRun);
	}

	//TIMOB-10007
	this.adhocProperties = function(testRun) {
		var win1 = Ti.UI.createWindow({
			backgroundColor:'white'
		});
		win1.applyProperties({
			backgroundColor : '#336699',
			borderWidth : 8,
			borderColor : '#999',
			borderRadius : 10,
			height : 400,
			width : 300,
			opacity : 0.92
		});
		win1.addEventListener('open', function(){
			valueOf(testRun,win1.getBackgroundColor()).shouldBe('#336699');
			valueOf(testRun,win1.getBorderWidth()).shouldBe(8);
			valueOf(testRun,win1.getBorderColor()).shouldBe('#999');
			valueOf(testRun,win1.getBorderRadius()).shouldBe(10);
			valueOf(testRun,win1.getHeight()).shouldBe(400);
			valueOf(testRun,win1.getWidth()).shouldBe(300);
			valueOf(testRun,win1.getOpacity()).shouldBe(0.92);

			finish(testRun);
		});
		win1.open();
	}
}