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
		{name: "doublePrecision"}
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
}
