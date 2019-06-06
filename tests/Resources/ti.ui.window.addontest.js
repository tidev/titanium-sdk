/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';

describe('Titanium.UI.Window', function () {
	var win;

	this.timeout(5000);

	afterEach(function () {
		if (win) {
			win.close();
		}
		win = null;
	});

	// Performs an Android shared-element transition animation between 2 windows.
	// Labels from parent window will move to child window's label positions during open animation.
	it.android('#addSharedElement()', function (finish) {
		this.slow(3000);
		this.timeout(5000);

		win = Ti.UI.createWindow({
			backgroundColor: 'blue'
		});
		const sourceLabel1 = Ti.UI.createLabel({
			text: 'Transition Label 1',
			top: '10dp',
			left: '10dp'
		});
		win.add(sourceLabel1);
		const sourceLabel2 = Ti.UI.createLabel({
			text: 'Transition Label 2',
			bottom: '10dp',
			right: '10dp'
		});
		win.add(sourceLabel2);
		win.addEventListener('postlayout', function eventHandler() {
			win.removeEventListener('postlayout', eventHandler);
			const childWindow = Ti.UI.createWindow({
				backgroundColor: 'purple'
			});
			const targetLabel1 = Ti.UI.createLabel({
				text: 'Transition Label 1',
				transitionName: 'label1Transition',
				bottom: '10dp',
				left: '10dp'
			});
			childWindow.add(targetLabel1);
			childWindow.addSharedElement(sourceLabel1, targetLabel1.transitionName);
			const targetLabel2 = Ti.UI.createLabel({
				text: 'Transition Label 2',
				transitionName: 'label2Transition',
				top: '10dp',
				right: '10dp'
			});
			childWindow.add(targetLabel2);
			childWindow.addSharedElement(sourceLabel2, targetLabel2.transitionName);
			childWindow.addEventListener('open', function () {
				// Wait for transition animation to end before closing. (We don't have an event for this.)
				setTimeout(function () {
					childWindow.close();
				}, 750);
			});
			childWindow.addEventListener('close', function () {
				// The exit animation has finished. We're done.
				finish();
			});
			childWindow.open();
		});
		win.open();
	});

	describe.android('activity transitions', function () {
		this.slow(3000);
		this.timeout(5000);

		function doTransitionTest(windowSettings, finish) {
			windowSettings.title = 'Child Window';
			windowSettings.backgroundColor = 'blue';
			win = Ti.UI.createWindow(windowSettings);
			win.addEventListener('open', function () {
				setTimeout(function () {
					win.close();
					win = null;
				}, 750);
			});
			win.addEventListener('close', function () {
				finish();
			});
			win.open();
		}

		it.android('TRANSITION_FADE_IN/TRANSITION_FADE_OUT', function (finish) {
			const windowSettings = {
				activityEnterTransition: Ti.UI.Android.TRANSITION_FADE_IN,
				activityReenterTransition: Ti.UI.Android.TRANSITION_FADE_IN,
				activitySharedElementEnterTransition: Ti.UI.Android.TRANSITION_NONE,
				activitySharedElementReenterTransition: Ti.UI.Android.TRANSITION_NONE,
				activityExitTransition: Ti.UI.Android.TRANSITION_FADE_OUT,
				activityReturnTransition: Ti.UI.Android.TRANSITION_FADE_OUT,
				activitySharedElementExitTransition: Ti.UI.Android.TRANSITION_NONE,
				activitySharedElementReturnTransition: Ti.UI.Android.TRANSITION_NONE
			};
			doTransitionTest(windowSettings, finish);
		});

		it.android('TRANSITION_SLIDE_RIGHT', function (finish) {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_SLIDE_RIGHT }, finish);
		});

		it.android('TRANSITION_SLIDE_LEFT', function (finish) {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_SLIDE_LEFT }, finish);
		});

		it.android('TRANSITION_SLIDE_TOP', function (finish) {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_SLIDE_TOP }, finish);
		});

		it.android('TRANSITION_SLIDE_BOTTOM', function (finish) {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_SLIDE_BOTTOM }, finish);
		});

		it.android('TRANSITION_EXPLODE', function (finish) {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_EXPLODE }, finish);
		});

		it.android('TRANSITION_NONE', function (finish) {
			doTransitionTest({ activityEnterTransition: Ti.UI.Android.TRANSITION_NONE }, finish);
		});
	});
});
