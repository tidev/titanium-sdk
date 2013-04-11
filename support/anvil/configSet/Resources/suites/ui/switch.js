/* Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details. */

// Simple automated tests of Ti.UI.Switch.

module.exports = new function() {
	var finish,
	   valueOf;
		
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "switch";
	this.tests = [
		{name: "properties_methods", timeout: 5000},
		{name: "action", timeout: 5000}
	];
		
	
	// Check the default values of properties;
	// Change the values of properties with setters;
	// Check the new values of properties with getters.
	this.properties_methods = function(testRun) {
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

	// Try to create the Switch and add to a window.
	// Try to click on this switch.
	// Check the value for this switch, it should be changed.
	this.action = function(testRun) {
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
}