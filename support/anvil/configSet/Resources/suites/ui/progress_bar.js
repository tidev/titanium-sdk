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

	this.name = "progress_bar";
	this.tests = [
		{name: "testProperties"}
	];

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
}