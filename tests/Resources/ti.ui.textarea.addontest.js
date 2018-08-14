/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti, Titanium */
/* eslint no-unused-expressions: "off" */
'use strict';

describe('Titanium.UI.TextArea', function () {
	var win;

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	// Tests adding and removing a TextArea's focus.
	it('textArea in tabGroup', function (finish) {
		var windowA, windowB, tabA, tabB, tabGroup;

		this.timeout(7500);

		windowA = Ti.UI.createWindow();
		windowB = Ti.UI.createWindow();

		tabA = Ti.UI.createTab({
			window: windowA,
			title: 'Tab A'
		});

		tabB = Ti.UI.createTab({
			window: windowB,
			title: 'Tab B'
		});

		tabGroup = Titanium.UI.createTabGroup({
			tabs: [ tabA, tabB ]
		});

		windowA.addEventListener('open', function () {
			var subwin, typingView, keyboardMessageView, keyboardMessage;

			subwin = Ti.UI.createWindow({ backgroundColor: 'blur' });

			subwin.addEventListener('open', function () {
				finish();
			});

			typingView = Ti.UI.createView();
			keyboardMessageView = Ti.UI.createView();
			keyboardMessage = Ti.UI.createTextArea();

			keyboardMessageView.add(keyboardMessage);
			typingView.add(keyboardMessageView);
			subwin.add(typingView);

			setTimeout(function () {
				tabA.open(subwin);
			}, 1000);
		});

		tabGroup.open();
	});
});
