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

	this.name = "ui_picker";
	this.tests = [
		{name: "showDatePickerDialog"},
		{name: "datePickerGetValue"},
		{name: "countdownPicker"}
	]

	//TIMOB-6956
	this.showDatePickerDialog = function(testRun) {
		if (Ti.Platform.osname === 'android') {
			var picker = Ti.UI.createPicker();
			valueOf(testRun, function(){
				picker.showDatePickerDialog({
					value : new Date(2010,8,1)
				});
			}).shouldNotThrowException();

			finish(testRun);
		} else {

			finish(testRun);
		}
	}

	//TIMOB-7313
	this.datePickerGetValue = function(testRun) {
		if (Ti.Platform.osname === 'android') {
			var win = Ti.UI.createWindow({
				backgroundColor: '#000'
			});
			var datePicker = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_DATE,
				useSpinner: false
			});
			var customPicker = Ti.UI.createPicker({
				type: Ti.UI.PICKER_TYPE_DATE,
				useSpinner: false
			});
			win.add(datePicker);
			win.add(customPicker);
			win.open();
			setTimeout(function() {
				valueOf(testRun, function(){
					datePicker.getValue()
				}).shouldNotThrowException();
				valueOf(testRun, customPicker.getValue()).shouldNotBeUndefined();

				finish(testRun);
			}, 10000);
		} else {

			finish(testRun);
		}
	}

	//TIMOB-1462
	this.countdownPicker = function(testRun) {
		if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
			var win1 = Titanium.UI.createWindow({
				backgroundColor:'black'
			});
			var duration = 60000 * 3;
			var picker = Ti.UI.createPicker({
				type:Ti.UI.PICKER_TYPE_COUNT_DOWN_TIMER,
				countDownDuration:duration
			});
			picker.selectionIndicator = true;
			win1.add(picker);
			win1.open();
			setTimeout(function() {
				valueOf(testRun, picker.getCountDownDuration( )).shouldBe(180000);
			}, 10000);

			finish(testRun);
		} else {

			finish(testRun);
		}
	}
}
