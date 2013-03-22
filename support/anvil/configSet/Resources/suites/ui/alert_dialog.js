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

	this.name = "alert_dialog";
	this.tests = (function() {
		var arr = [
			{name: "testButtons"},
			{name: "testCancel"},
			{name: "testOk"},
			{name: "testMessage"},
			{name: "testTitle"}
		];

		(isTizen || isMobileWeb) && arr.push({name: "showHide"});

		return arr;
	}());

	this.showHide = function(testRun) {
		// Show a red full-screen window that will be a test background for the
		// alert dialog. Then show the alert dialog, and verify the number of
		// background-colored pixels has decreased, as the alert dialog covered them.
		// (There is no direct way of setting colours for the alert dialog.)
		// Afterwards, hide and show dialog again, checking the colours again.		
		var wind = Ti.UI.createWindow({
				backgroundColor: '#ff0000'
			}),
			dialog = Ti.UI.createAlertDialog({
			    cancel: 1,
			    buttonNames: ['Confirm', 'Cancel', 'Help'],
			    message: 'Would you like to delete the file?',
			    title: 'Delete'
			});
		
		wind.addEventListener('open', showDialog);
		wind.addEventListener('close', function() {
			finish(testRun);
		});

		wind.open();
		
		function showDialog() {
			var cp = new CountPixels();

			cp.countPixelsPercentage([255, 0, 0], document.body, callback1);

			function callback1(count) {
				Ti.API.info(count);
				
				valueOf(testRun, function() {
					dialog.show();
				}).shouldNotThrowException();
				
				setTimeout(function() {
					cp.countPixelsPercentage([255, 0, 0], document.body, callback2);
				}, 500)	
			}

			function callback2(count) {
				Ti.API.info(count);
				valueOf(testRun, count).shouldBe(0);
				valueOf(testRun, function() {	
					dialog.hide();
				}).shouldNotThrowException();
				setTimeout(function() {
					cp.countPixelsPercentage([255, 0, 0], document.body, callback3);
				}, 500);
			}	

			function callback3(count) {
				Ti.API.info(count);
				valueOf(testRun, count).shouldBe(100);
				wind.close();
			}
		}
	}

	this.testButtons = function(testRun) {
		var dialog = Ti.UI.createAlertDialog({
				message: 'Would you like to delete the file?',
				title: 'Delete'
			}),
			buttons = [ 'Confirm', 'Cancel', 'Help' ],
			gotten_buttons;

		dialog.buttonNames = buttons;
		gotten_buttons = dialog.getButtonNames();

		for (var i = 0, len = gotten_buttons.length; i < len; i++) {
			buttons[i] && valueOf(testRun, gotten_buttons[i]).shouldBe(buttons[i]);
		}
		
		finish(testRun);
	}

	this.testCancel = function(testRun) {
		var dialog = Ti.UI.createAlertDialog({
				buttonNames: [ 'Confirm', 'Cancel', 'Help' ],
				message: 'Would you like to delete the file?',
				title: 'Delete'
			}),
			cancel = 1,
			gotten_cancel;

		dialog.cancel = cancel;
		gotten_cancel = dialog.getCancel();
		
		valueOf(testRun, gotten_cancel).shouldBe(cancel);

		finish(testRun);
	}

	this.testOk = function(testRun) {
		var dialog = Ti.UI.createAlertDialog({
			buttonNames: [ 'Confirm', 'Cancel', 'Help' ],
			message: 'Would you like to delete the file?',
			title: 'Delete'
		}),
		ok = 'Delete',
		gotten_ok;

		dialog.ok = ok;
		gotten_ok = dialog.getOk();

		valueOf(testRun, gotten_ok).shouldBe(ok);

		finish(testRun);
	}

	this.testMessage = function(testRun) {
		var dialog = Ti.UI.createAlertDialog({
			cancel: 1,
			buttonNames: [ 'Confirm', 'Cancel', 'Help' ],
			title: 'Delete'
		}),
		message = "my message",
		gotten_message;

		dialog.message = message;
		gotten_message = dialog.getMessage();

		valueOf(testRun, gotten_message).shouldBe(message);

		finish(testRun);
	}

	this.testTitle = function(testRun) {
		var dialog = Ti.UI.createAlertDialog({
			cancel: 1,
			buttonNames: [ 'Confirm', 'Cancel', 'Help' ],
			message: 'Would you like to delete the file?',
		}),
		title = 'ALERT',
		gotten_title;

		dialog.title = title;
		gotten_title = dialog.getTitle();
		
		valueOf(testRun, gotten_title).shouldBe(title);

		finish(testRun);
	}
}