/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

// Simple tests of Ti.UI.AlertDialog that verify whether it remembers its configuration
// and if it doesn't crash when created.

module.exports = new function() {
	var finish,
		valueOf;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "alert_dialog";
	this.tests = [
		{name: "testButtons"},
		{name: "testCancel"},
		{name: "testOk"},
		{name: "testMessage"},
		{name: "testTitle"}
	];

	// Simulates file deletion (does not actually delete anything)
	// Verifies that the dialog doesn't crash and remembers the buttons configured for it
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

	// Verifies that the dialog doesn't crash and remembers which button is "cancel"
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

	// Verifies that the dialog doesn't crash and remembers which button is "OK"
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

	// Verifies that the dialog doesn't crash and remembers which text message it has
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

	// Verifies that the dialog doesn't crash and remembers which title it has
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