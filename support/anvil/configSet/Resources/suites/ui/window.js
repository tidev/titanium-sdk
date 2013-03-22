/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

var isTizen = Ti.Platform.osname === 'tizen',
	isMobileWeb = Ti.Platform.osname === 'mobileweb';

(isTizen || isMobileWeb) && Ti.include('countPixels.js');

module.exports = new function() {
	var finish;
	var valueOf;
		
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "window";
	this.tests = (function() {
		var arr = [];

		if (isTizen || isMobileWeb) {
			arr = arr.concat([
				{name: "basic"},
				{name: "add_remove"},
				{name: "titleAndNavButtons"},
				{name: "navBarProperties"},
				{name: "navBarImage"},
				{name: "titleControl"}
			]);
		}

		return arr;
	}());	

	this.basic = function(testRun) {
		var win,
			cp = new CountPixels(),
			onTestReady = function(count) {
				valueOf(testRun, count).shouldBeEqual(0);

				valueOf(testRun, function() {
					win.open();
				}).shouldNotThrowException();
			},
			onWindowReady = function(count) {
				valueOf(testRun, count).shouldBeEqual(100);

				valueOf(testRun, function() {
					win.close();
				}).shouldNotThrowException();
			},
			onWindowClose = function(count) {
				valueOf(testRun, count).shouldBeEqual(0);
				finish(testRun);
			};

		valueOf(testRun, function() {
			win = Ti.UI.createWindow({
				backgroundColor: '#FF0000'
			});
		}).shouldNotThrowException();

		cp.countPixelsPercentage([255, 0, 0], document.body, onTestReady);

		win.addEventListener('postlayout', function() {
			cp.countPixelsPercentage([255, 0, 0], document.body, onWindowReady);
		});

		win.addEventListener('close', function() {
			cp.countPixelsPercentage([255, 0, 0], document.body, onWindowClose);
		});
	}

	this.add_remove = function(testRun) {
		var cp = new CountPixels(),
			win = Ti.UI.createWindow({
				backgroundColor: '#FFFFFF'
			}),
			btn = Ti.UI.createButton({
				backgroundColor: '#FF0000',
				width: 50,
				height: 50
			}),
			onButtonRemoved = function(count) {
				valueOf(testRun, count).shouldBeEqual(0);
				finish(testRun);
			},
			onWindowReady = function(count) {
				valueOf(testRun, count).shouldBeEqual(2500);

				valueOf(testRun, function() {
					win.remove(btn);
				}).shouldNotThrowException();

				cp.countPixels([255, 0, 0], win, onButtonRemoved);
			};

		win.addEventListener('postlayout', function() {
			cp.countPixels([255, 0, 0], win, onWindowReady);
		});

		win.addEventListener('close', function() {
			finish(testRun);
		});

		valueOf(testRun, function() {
			win.add(btn);
		}).shouldNotThrowException();

		win.open();
	}

	this.titleAndNavButtons = function(testRun) {
		var cp = new CountPixels(),
			tabGroup = Titanium.UI.createTabGroup({
				color: '#00FF00'
			}),
			leftNavBtn = Titanium.UI.createButton({
				width: 20,
				height: 20,
				backgroundColor: '#FF0000'
			}),
			rightNavBtn = Titanium.UI.createButton({
				width: 20,
				height: 20,
				backgroundColor: '#0000FF'
			}),
			win1 = Titanium.UI.createWindow({
				// This is green squares, and we can check if this squares are present in window with pixel tests
				title:'&#9607;&#9607;&#9607;&#9607;&#9607;&#9607;&#9607',
				backgroundColor: '#FFFFFF',
				leftNavButton: leftNavBtn,
				rightNavButton: rightNavBtn
			}),
			tab1 = Titanium.UI.createTab({
				title:'Tab 1',
				window:win1,
				color: '#000000'
			}),
			win2 = Titanium.UI.createWindow({
				title:'Tab 2',
				backgroundColor:'#FFFFFF'
			}),
			tab2 = Titanium.UI.createTab({
				title:'Tab 2',
				window:win2,
				color: '#000000'
			}),
			onTabsCompleteRed = function(count) {
				valueOf(testRun, count).shouldBeEqual(400);
				tabGroup.close();
			},
			onTabsCompleteBlue = function(count) {
				valueOf(testRun, count).shouldBeEqual(400);
				cp.countPixels([255, 0, 0], document.body, onTabsCompleteRed);
			},
			onTabsCompleteGreen = function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(100);
				cp.countPixels([0, 0, 255], document.body, onTabsCompleteBlue);
			};

		tabGroup.addTab(tab1);
		tabGroup.addTab(tab2);

		tabGroup.addEventListener('postlayout', function() {
			cp.countPixels([0, 255, 0], document.body, onTabsCompleteGreen);
		});

		tabGroup.addEventListener('close', function() {
			finish(testRun);
		});

		tabGroup.open();
	}

	this.navBarProperties = function(testRun) {
		var cp = new CountPixels(),
			tabGroup = Titanium.UI.createTabGroup({
				backgroundColor: '#000000'
			}),
			win1 = Titanium.UI.createWindow({
				titleImage: 'suites/ui/window/image.png',
				barColor: '#00FF00'
			}),
			tab1 = Titanium.UI.createTab({
				title:'Tab 1',
				window: win1,
				color: '#000000'
			}),
			win2 = Titanium.UI.createWindow({
				title: 'Tab 2',
				backgroundColor: '#FFFFFF'
			}),
			tab2 = Titanium.UI.createTab({
				title: 'Tab 2',
				window: win2,
				color: '#000000'
			}),
			onTabsCompleteBarColorTranslucent = function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(100);

				tabGroup.close();
			},
			onTabsCompleteBarColor = function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(100);
				win1.translucent = true;
				cp.countPixels([0, 127, 0], document.body, onTabsCompleteBarColorTranslucent);
			},
			onTabsCompleteTitleImage = function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(100);
				cp.countPixels([0, 255, 0], document.body, onTabsCompleteBarColor);
			};

		tabGroup.addTab(tab1);
		tabGroup.addTab(tab2);

		tabGroup.addEventListener('postlayout', function() {
			cp.countPixels([255, 0, 0], document.body, onTabsCompleteTitleImage);
		});

		tabGroup.addEventListener('close', function() {
			finish(testRun);
		});

		tabGroup.open();
	}

	this.navBarImage = function(testRun) {
		var cp = new CountPixels(),
			tabGroup = Titanium.UI.createTabGroup({
				backgroundColor: '#000000'
			}),
			win1 = Titanium.UI.createWindow({
				barImage: 'suites/ui/window/image.png'
			}),
			tab1 = Titanium.UI.createTab({
				title: 'Tab 1',
				window: win1,
				color: '#000000'
			}),
			win2 = Titanium.UI.createWindow({
				title: 'Tab 2',
				backgroundColor: '#FFFFFF'
			}),
			tab2 = Titanium.UI.createTab({
				title:'Tab 2',
				window: win2,
				color: '#000000'
			}),

			onTabsCompleteBarImage = function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(100);
				tabGroup.close();
			};

		tabGroup.addTab(tab1);
		tabGroup.addTab(tab2);

		tabGroup.addEventListener('postlayout', function() {
			cp.countPixels([255, 0, 0], document.body, onTabsCompleteBarImage);
		});

		tabGroup.addEventListener('close', function() {
			finish(testRun);
		});

		tabGroup.open();
	}

	this.titleControl = function(testRun) {
		var cp = new CountPixels(),
			tabGroup = Titanium.UI.createTabGroup({
				backgroundColor: '#000000'
			}),
			sw = Titanium.UI.createSwitch({
				value: false,
				backgroundColor: '#FF0000',
				width: 100,
				height: 30
			}),
			win1 = Titanium.UI.createWindow({
				backgroundColor: '#FFFFFF',
				titleControl: sw
			}),
			tab1 = Titanium.UI.createTab({
				title: 'Tab 1',
				window: win1,
				color: '#000000'
			}),
			win2 = Titanium.UI.createWindow({
				title: 'Tab 2',
				backgroundColor:'#FFFFFF'
			}),
			tab2 = Titanium.UI.createTab({
				title: 'Tab 2',
				window:win2,
				color: '#000000'
			}),

			onTabsCompleteBarImage = function(count) {
				valueOf(testRun, count).shouldBeGreaterThan(100);
				tabGroup.close();
			};

		tabGroup.addTab(tab1);
		tabGroup.addTab(tab2);

		tabGroup.addEventListener('postlayout', function() {
			cp.countPixels([255, 0, 0], document.body, onTabsCompleteBarImage);
		});

		tabGroup.addEventListener('close', function() {
			finish(testRun);
		});

		tabGroup.open();
	}
}
