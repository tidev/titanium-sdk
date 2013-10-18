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

	this.name = "app";
	this.tests = [
		{name: "test_custom_values"},
		{name: "test_setObjectGetObject"},
		{name: "test_userDefaultProperties_A"},
		{name: "test_userDefaultProperties_B"},
		{name: "test_encodeURIComponent"},
		{name: "test_caseWrong"},
		{name: "test_keyboardVisible"},
		{name: "test_getDoubleInt"},
		{name: "test_changeEvent"},
		{name: "test_setObjectNullValue"}
		
	]

	this.test_custom_values = function(testRun) {
		valueOf(testRun, Ti.App.id).shouldBe('org.appcelerator.titanium.testharness');
		valueOf(testRun, Ti.App.name).shouldBe('test_harness');
		valueOf(testRun, Ti.App.version).shouldBe("1.0.1");
		valueOf(testRun, Ti.App.publisher).shouldBe("test publisher");
		valueOf(testRun, Ti.App.url).shouldBe("http://www.test.com");
		valueOf(testRun, Ti.App.description).shouldBe('test description');
		valueOf(testRun, Ti.App.copyright).shouldBe('copyright 2010 test');

		finish(testRun);
	}

	//TIMOB-322
	this.test_setObjectGetObject = function(testRun) {
		var getObj = Ti.App.Properties.getObject('MyGetObject', { key: 'get works!' });
		valueOf(testRun, getObj && getObj.key).shouldBe('get works!');
		Ti.App.Properties.setObject('MySetObject', { key: 'set works!' });
		var setObj = Ti.App.Properties.getObject('MySetObject');
		valueOf(testRun, setObj && setObj.key).shouldBe('set works!');

		finish(testRun);
	}
	
	//TIMOB-5494_A
	this.test_userDefaultProperties_A = function(testRun) {
		Titanium.App.Properties.setString('my_prop', 'dadfcool');
		valueOf(testRun, Ti.App.Properties.hasProperty('my_prop')).shouldBeTrue();

		finish(testRun);
	}

	//TIMOB-5494_B
	this.test_userDefaultProperties_B = function(testRun) {
		valueOf(testRun, Ti.App.Properties.hasProperty('my_prop')).shouldBeTrue();

		finish(testRun);
	}

	//TIMOB-7743
	this.test_encodeURIComponent = function(testRun) {
		valueOf(testRun, encodeURIComponent("üöäß &?/ tes tetst et st e\ntest etes te stet")).shouldBe('%C3%BC%C3%B6%C3%A4%C3%9F%20%26%3F%2F%20tes%20tetst%20et%20st%20e%0Atest%20etes%20te%20stet');

		finish(testRun);
	}
	
	//TIMOB-7982
	this.test_caseWrong = function(testRun) {
		valueOf(testRun, function() {
		Ti.API.info("id:" + Titanium.App.id);
		Ti.API.info("getId():" + Titanium.App.getId());
		Ti.API.info("getURL():" + Titanium.App.getURL());
		Ti.API.info("url:" + Titanium.App.url);
		Ti.API.info("getUrl():" + Titanium.App.getUrl());
		Ti.API.info("getGUID():" + Titanium.App.getGUID());
		Ti.API.info("guid:" + Titanium.App.guid);
		Ti.API.info("getGuid():" + Titanium.App.getGuid());
		}).shouldNotThrowException();
	
		finish(testRun);
	}

	//TIMOB-8383
	this.test_keyboardVisible = function(testRun) {
		if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
			var win = Ti.UI.createWindow({
				backgroundColor:'white'
			});
			var input = Ti.UI.createTextField({
				width:200,
				height:40,
				value:'click me',
				top:20,
				borderStyle:Ti.UI.INPUT_BORDERSTYLE_LINE
			});
			input.addEventListener('focus', function isVisible() {
				valueOf(testRun, Ti.App.keyboardVisible).shouldBeTrue();
			});
			win.add(input);
			win.open();
			input.focus();

			finish(testRun);
		}else {
			Ti.API.warn("Cross-context tests aren't currently being tested in android");

			finish(testRun);
		}
	}
	
	//TIMOB-9350
	this.test_getDoubleInt = function(testRun) {
		valueOf(testRun, function() {
			Titanium.App.Properties.setInt('Int',10);
			Titanium.API.info('Int: '+ Titanium.App.Properties.getDouble('Int'));
		}).shouldNotThrowException();

		finish(testRun);
	
	}

	//TIMOB-10260, TIMOB-10314
	this.test_changeEvent = function(testRun) {
		Ti.App.Properties.setBool('test',false);
		valueOf(testRun, Ti.App.Properties.getBool('test')).shouldBeFalse();
		function onPropertiesChange()
		{
			finish(testRun);
		}
		Ti.App.Properties.addEventListener('change',onPropertiesChange);
		Ti.App.Properties.setBool('test',true);
		valueOf(testRun, Ti.App.Properties.getBool('test')).shouldBeTrue();
	}

	//TIMOB-11399
	this.test_setObjectNullValue = function(testRun) {
		var objectWithNullValue = {
			expires_at: 1347623585,
			value: {
				something: null
			}
		};
		Ti.App.Properties.setObject('Object1', objectWithNullValue);
		valueOf(testRun, Ti.App.Properties.getObject('Object1')).shouldBeObject();
		valueOf(testRun, Ti.App.Properties.getObject('Object1').value.something).shouldBeNull();

		finish(testRun);
	}
}