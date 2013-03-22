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

	this.name = "switch";
	this.tests = [
		{name: "basic", timeout: 5000},
		{name: "properties_methods", timeout: 5000},
		{name: "action", timeout: 5000},
		{name: "add_remove", timeout: 5000}
	];

	this.basic = function(testRun) {
		// Try to create the green Switch and add to red window.
		// Check the count of green pixels after that.
		var win = Ti.UI.createWindow({
				backgroundColor: '#FF0000'
			}),
			basicSwitch,
			cp;
		
		valueOf(testRun, function() {
			basicSwitch = Ti.UI.createSwitch({
				value: true,
				backgroundColor: '#00FF00',
				width: 100,
				height: 50
			});
		}).shouldNotThrowException();
		
		(isTizen || isMobileWeb) && (cp = new CountPixels());

		var onSwitchComplete = function(count) {
			valueOf(testRun, count).shouldBeGreaterThan(1000);

			win.close();
			finish(testRun);
		}
		
		win.addEventListener('postlayout', function() {
			if (isTizen || isMobileWeb) {
				cp.countPixels([0, 255, 0], win, onSwitchComplete);
			} else {
				win.close();

				finish(testRun);
			}
		});

		win.add(basicSwitch);
		win.open();
	}
		
		
	this.properties_methods = function(testRun) {
		// Check the default values of properties
		// Change the values of properties with set methods
		// Check the new values of properties with get methods
		var win = Ti.UI.createWindow({
				backgroundColor: '#FF0000'
			}),
			basicSwitch = Ti.UI.createSwitch({
				title: 'Some title'
			});
		
		valueOf(testRun, basicSwitch.color).shouldBeUndefined();
		valueOf(testRun, basicSwitch.enabled).shouldBeTrue();
		valueOf(testRun, basicSwitch.font).shouldBeUndefined();
		valueOf(testRun, basicSwitch.titleOff).shouldBeEqual('Off');
		valueOf(testRun, basicSwitch.titleOn).shouldBeEqual('On');
		valueOf(testRun, basicSwitch.value).shouldBeFalse();
		valueOf(testRun, basicSwitch.getColor()).shouldBeUndefined();
		valueOf(testRun, basicSwitch.getEnabled()).shouldBeTrue();
		valueOf(testRun, basicSwitch.getFont()).shouldBeUndefined();
		valueOf(testRun, basicSwitch.getTitleOff()).shouldBeEqual('Off');
		valueOf(testRun, basicSwitch.getTitleOn()).shouldBeEqual('On');
		valueOf(testRun, basicSwitch.getValue()).shouldBeFalse();
		
		valueOf(testRun, function() {
			basicSwitch.setColor('#FF0000');
		}).shouldNotThrowException();
		
		valueOf(testRun, function() {
			basicSwitch.setEnabled(false);
		}).shouldNotThrowException();
		
		valueOf(testRun, function() {
			basicSwitch.setFont({
				fontSize: 20
			});
		}).shouldNotThrowException();
		
		valueOf(testRun, function() {
		   basicSwitch.setTitleOff('Yeeeh')
		}).shouldNotThrowException();
		
		valueOf(testRun, function() {
		   basicSwitch.setTitleOn('Oh no')
		}).shouldNotThrowException();
		
		valueOf(testRun, function() {
		   basicSwitch.setValue(true)
		}).shouldNotThrowException();
		
		valueOf(testRun, basicSwitch.getColor()).shouldBeEqual('#FF0000');
		valueOf(testRun, basicSwitch.getEnabled()).shouldBeFalse();
		valueOf(testRun, basicSwitch.getFont().fontSize).shouldBeEqual(20);
		valueOf(testRun, basicSwitch.getTitleOff()).shouldBeEqual('Yeeeh');
		valueOf(testRun, basicSwitch.getTitleOn()).shouldBeEqual('Oh no');
		valueOf(testRun, basicSwitch.getValue()).shouldBeTrue();
		
		win.addEventListener('postlayout', function() {
			win.close();
			finish(testRun);
		});
		win.add(basicSwitch);
		win.open();
	}

	this.action = function(testRun) {
		// Try to create the Switch and add to window.
		// Try to click on this switch
		// Check the value for this switch, should be changed		
		var win = Ti.UI.createWindow({
				backgroundColor: '#FF0000'
			}),
			basicSwitch;
	   
		basicSwitch = Ti.UI.createSwitch({
			// Mandatory property for iOS 
			value: false 
		});
		
		win.addEventListener('postlayout', function() {
			valueOf(testRun, basicSwitch.value).shouldBeFalse();
			basicSwitch.fireEvent('singletap');
			valueOf(testRun, basicSwitch.value).shouldBeTrue();
			win.close();
			finish(testRun);
		});

		win.add(basicSwitch);
		win.open();
	}

	this.add_remove = function(testRun) {
		// Try to add the blue button for red switch.
		// Check if switch contains blue pixels
		// Try to remove this button
		// Check if switch does not contain blue pixels anymore
		var win = Ti.UI.createWindow({
				backgroundColor: '#FFFFFF'
			}),
			basicSwitch = Ti.UI.createSwitch({
				value:false, // mandatory property for iOS 
				backgroundColor: '#FF0000',
				height: 100,
				width: 100
			}),
			btn = Ti.UI.createButton({
				backgroundColor: '#0000FF',
				height: 50,
				width: 50
			}),
			cp;
		
		(isTizen || isMobileWeb) && (cp = new CountPixels());

		var bluePixelsAfterRemovingCB = function(count) {
			valueOf(testRun, count).shouldBeEqual(0);
			win.close();
			finish(testRun);
		}

		var bluePixelsCB = function(count) {
			valueOf(testRun, count).shouldBeEqual(2500);
			valueOf(testRun, function(){
				basicSwitch.remove(btn);
			}).shouldNotThrowException();
			
			cp.countPixels([0, 0, 255], basicSwitch, bluePixelsAfterRemovingCB);
		}
		
		valueOf(testRun, function() {
			basicSwitch.add(btn);
		}).shouldNotThrowException();
		
		win.addEventListener('postlayout', function() {
			if (isTizen || isMobileWeb) {
				cp.countPixels([0, 0, 255], basicSwitch, bluePixelsCB);
			} else {
				win.close();
				finish(testRun);
			}
		});
		
		win.add(basicSwitch);
		win.open();
	}
}