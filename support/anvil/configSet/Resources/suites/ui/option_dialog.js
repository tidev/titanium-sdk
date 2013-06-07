/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

// Simple automated tests of Ti.UI.OptionDialog.

module.exports = new function() {
	var finish,
		valueOf;

	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "option_dialog";
	this.tests = [	
		{name: "testOptions"},
		{name: "testCancel"},
		{name: "testDestructive"},
		{name: "testTitle"}
	];

	// Verify if the dialog displays the options properly, by analyzing the resulting
	// HTML DOM entities.
	this.testOptions = function(testRun) {
		var wind = Ti.UI.createWindow(),
			optionsDialogOpts = {
				destructive:1,
				cancel:2,
				title:'I am a title'
			},
			// Create option dialog
			dialog = Titanium.UI.createOptionDialog(optionsDialogOpts),
			// This options will be cecked
			buttons = ['Option 1', 'Option 2', 'Option 3', 'Option 4']; 

		dialog.options = buttons;

		var gotten_options = dialog.getOptions();

		for (var i = 0, len = gotten_options.length; i < len; i++) {
			buttons[i] && valueOf(testRun, gotten_options[i]).shouldBe(buttons[i]);
		}

		wind.addEventListener('open', function() {
			dialog.show();
			setTimeout(checkOptions, 500);
		});

		wind.addEventListener('close', function() {
			finish(testRun);
		});

		wind.open();

		// In this test we find buttons of option dialog in DOM structure and compare their labels with 
		// apropriate options, wich we assigned above.
		function checkOptions() {
			var dialog_node = document.getElementsByClassName('TiUIWindow')[1],
				button_nodes = dialog_node.getElementsByClassName('TiUIButton');

			Ti.API.info(button_nodes.length);

			if (button_nodes.length < 4) {
				valueOf(testRun, false).shouldBeTrue();
			} else {
				for (var i = 0, len = button_nodes.length; i < len; i++) {
					var label_node = button_nodes[i].getElementsByClassName('TiUILabel')[0],
						label_view = label_node.getElementsByClassName('TiUIView')[0];

					valueOf(testRun, label_view.innerHTML).shouldBe[buttons[i]];
				}
			}

			dialog.hide();
			
			setTimeout(function() {
				wind.close();
			}, 500)
		}
	}

	// Check if the option dialog remembers which button is Cancel.
	this.testCancel = function(testRun) {
		var optionsDialogOpts = {
				options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
				destructive: 1,
				title: 'I am a title'
			},
			dialog = Titanium.UI.createOptionDialog(optionsDialogOpts),
			cancel = 2;

		dialog.cancel = cancel;

		var gotten_cancel = dialog.getCancel();
		
		valueOf(testRun, gotten_cancel).shouldBe(cancel);

      	finish(testRun);
	}

	// Check if the option dialog remembers which button is destructive (visually
	// marked as dangerous).
	this.testDestructive = function(testRun) {
		var optionsDialogOpts = {
				options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
				cancel: 2,
				title: 'I am a title'
			},
			dialog = Titanium.UI.createOptionDialog(optionsDialogOpts),
			destructive = 1;

		dialog.destructive = destructive;

		var gotten_destructive = dialog.getDestructive();

		valueOf(testRun, gotten_destructive).shouldBe(destructive);

      	finish(testRun);
	}

	// Check if the option dialog remembers which title it should show.
	this.testTitle = function(testRun) {
		var optionsDialogOpts = {
				options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
				destructive: 1,
				cancel: 2
			},
			dialog = Titanium.UI.createOptionDialog(optionsDialogOpts), 
			title = 'I am a title';

		dialog.title = title;

		var gotten_title = dialog.getTitle();
		
		valueOf(testRun, gotten_title).shouldBe(title);

      	finish(testRun);
	}
}