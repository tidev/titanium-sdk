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

	this.name = "properties";
	this.tests = [
		{name: "setsAndGets"},
		{name: "doublePrecision"},
		{name: "test_userDefaultProperties_A"},
		{name: "test_userDefaultProperties_B"},
		{name: "test_encodeURIComponent"},
		{name: "test_caseWrong"},
		{name: "test_keyboardVisible"},
		{name: "test_getDoubleInt"},
		{name: "test_changeEvent"},
		{name: "test_setObjectNullValue"}
	]

	this.setsAndGets = function(testRun) {
		var array = [
			{name:'Name 1', address:'1 Main St'},
			{name:'Name 2', address:'2 Main St'},
			{name:'Name 3', address:'3 Main St'},
			{name:'Name 4', address:'4 Main St'}	
		];
		var object = {
			name1:'1 Main St',
			name2:'2 Main St',
			name3:'3 Main St',
			name4:'4 Main St'
		};

		//
		// Test Default handling
		//
		valueOf(testRun, Ti.App.Properties.getBool('whatever',true)).shouldBe(true);
		valueOf(testRun, Ti.App.Properties.getDouble('whatever',2.5)).shouldBe(2.5);
		valueOf(testRun, Ti.App.Properties.getInt('whatever',1)).shouldBe(1);
		valueOf(testRun, Ti.App.Properties.getString('whatever',"Fred")).shouldBe("Fred");

		// First StringList Test
		var defaultList = ["testOne","testTwo"];
		valueOf(testRun, JSON.stringify(Ti.App.Properties.getList('whatever',defaultList))).shouldBe(JSON.stringify(defaultList));
		// Second StringList Test
		defaultList = [];
		valueOf(testRun, JSON.stringify(Ti.App.Properties.getList('whatever',defaultList))).shouldBe(JSON.stringify(defaultList));

		// First Object Test
		var defaultObject = {Cat:"Dog"};
		valueOf(testRun, JSON.stringify(Ti.App.Properties.getObject('whatever',defaultObject))).shouldBe(JSON.stringify(defaultObject));
		// Second Object Test
		defaultObject = {};
		valueOf(testRun, JSON.stringify(Ti.App.Properties.getObject('whatever',defaultObject))).shouldBe(JSON.stringify(defaultObject));

		//No Defaults
		valueOf(testRun, Ti.App.Properties.getBool('whatever')).shouldBeNull();
		valueOf(testRun, Ti.App.Properties.getDouble('whatever')).shouldBeNull();
		valueOf(testRun, Ti.App.Properties.getInt('whatever')).shouldBeNull();
		valueOf(testRun, Ti.App.Properties.getString('whatever')).shouldBeNull();
		valueOf(testRun, Ti.App.Properties.getList('whatever')).shouldBeNull();
		valueOf(testRun, Ti.App.Properties.getObject('whatever')).shouldBeNull();

		//
		// Round-trip tests
		//
		Titanium.App.Properties.setString('String','I am a String Value ');
		valueOf(testRun, Ti.App.Properties.getString('String')).shouldBe('I am a String Value ');
		Titanium.App.Properties.setInt('Int',10);
		valueOf(testRun, Ti.App.Properties.getInt('Int')).shouldBe(10);
		Titanium.App.Properties.setBool('Bool',true);
		valueOf(testRun, Ti.App.Properties.getBool('Bool')).shouldBe(true);
		Titanium.App.Properties.setDouble('Double',10.6);
		// for android's sake, we need to round the double, which gets 
		// stored as a float and comes back with some lost precision
		var d = Ti.App.Properties.getDouble('Double')
		valueOf(testRun, Number(d).toPrecision(5)).shouldBe(Number(10.6).toPrecision(5));
		
		Titanium.App.Properties.setList('MyList',array);
		var list = Titanium.App.Properties.getList('MyList');
		for (var i=0;i<list.length;i++)
		{
			valueOf(testRun, list[i].name).shouldBe(array[i].name);
			valueOf(testRun, list[i].address).shouldBe(array[i].address);
		}
		
		Titanium.App.Properties.setObject('MyObject',object);
		var myObject = Titanium.App.Properties.getObject('MyObject');
		for (var k in object)
		{
			valueOf(testRun, myObject.hasOwnProperty(k) && object.hasOwnProperty(k)).shouldBe(true);
			valueOf(testRun, myObject[k]).shouldBe(object[k]);
		}

		// We set 6 properties above, so make sure listProperties() includes them.
		var propnames = ['String', 'Int', 'Bool', 'Double', 'MyList', 'MyObject'];
		var proplist = Ti.App.Properties.listProperties();
		valueOf(testRun, proplist.length).shouldBeGreaterThanEqual(propnames.length);
		for (var j = 0; j < propnames.length; j++) {
			valueOf(testRun, proplist.indexOf(propnames[j])).shouldBeGreaterThan(-1);
		}

		//
		// test out remove property and setting to null
		//
		Titanium.App.Properties.setString('String',null);
		valueOf(testRun, Ti.App.Properties.getString('String')).shouldBeNull();
		Titanium.App.Properties.removeProperty('Int');
		valueOf(testRun, Ti.App.Properties.getString('Int')).shouldBeNull();

		finish(testRun);
	}

	this.doublePrecision = function(testRun) {
		var now = new Date();
		var time = now.getTime();
		Ti.App.Properties.setDouble('time', time);

		var value = Ti.App.Properties.getDouble('time');
		valueOf(testRun, value).shouldBe(time);

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
		if (Ti.Platform.osname === 'android') {
			valueOf(testRun, Titanium.App.id).shouldBe(Titanium.App.getId());
			valueOf(testRun, Titanium.App.id).shouldBe(Titanium.App.getID());
			valueOf(testRun, Titanium.App.url).shouldBe(Titanium.App.getUrl());
			valueOf(testRun, Titanium.App.url).shouldBe(Titanium.App.getURL());
			valueOf(testRun, Titanium.App.guid).shouldBe(Titanium.App.getGuid());
			valueOf(testRun, Titanium.App.guid).shouldBe(Titanium.App.getGUID());
		}

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
		}

		finish(testRun);
	}
	
	//TIMOB-9350
	this.test_getDoubleInt = function(testRun) {
		Titanium.App.Properties.setInt('Int',10);
		valueOf(testRun, Titanium.App.Properties.getDouble('Int')).shouldBe(10);

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
