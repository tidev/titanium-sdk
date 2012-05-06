/*global Titanium, Ti, describe, valueOf */
describe("Ti.Properties tests", {
	setsAndGets: function() {
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
		valueOf(Ti.App.Properties.getBool('whatever',true)).shouldBe(true);
		valueOf(Ti.App.Properties.getDouble('whatever',2.5)).shouldBe(2.5);
		valueOf(Ti.App.Properties.getInt('whatever',1)).shouldBe(1);
		valueOf(Ti.App.Properties.getString('whatever',"Fred")).shouldBe("Fred");

		// First StringList Test
		var defaultList = ["testOne","testTwo"];
		valueOf(JSON.stringify(Ti.App.Properties.getList('whatever',defaultList))).shouldBe(JSON.stringify(defaultList));
		// Second StringList Test
		defaultList = [];
		valueOf(JSON.stringify(Ti.App.Properties.getList('whatever',defaultList))).shouldBe(JSON.stringify(defaultList));

		// First Object Test
		var defaultObject = {Cat:"Dog"};
		valueOf(JSON.stringify(Ti.App.Properties.getObject('whatever',defaultObject))).shouldBe(JSON.stringify(defaultObject));
		// Second Object Test
		defaultObject = {};
		valueOf(JSON.stringify(Ti.App.Properties.getObject('whatever',defaultObject))).shouldBe(JSON.stringify(defaultObject));

		//No Defaults
		valueOf(Ti.App.Properties.getBool('whatever')).shouldBeNull();
		valueOf(Ti.App.Properties.getDouble('whatever')).shouldBeNull();
		valueOf(Ti.App.Properties.getInt('whatever')).shouldBeNull();
		valueOf(Ti.App.Properties.getString('whatever')).shouldBeNull();
		valueOf(Ti.App.Properties.getList('whatever')).shouldBeNull();
		valueOf(Ti.App.Properties.getObject('whatever')).shouldBeNull();

		//
		// Round-trip tests
		//
		Titanium.App.Properties.setString('String','I am a String Value ');
		valueOf(Ti.App.Properties.getString('String')).shouldBe('I am a String Value ');
		Titanium.App.Properties.setInt('Int',10);
		valueOf(Ti.App.Properties.getInt('Int')).shouldBe(10);
		Titanium.App.Properties.setBool('Bool',true);
		valueOf(Ti.App.Properties.getBool('Bool')).shouldBe(true);
		Titanium.App.Properties.setDouble('Double',10.6);
		// for android's sake, we need to round the double, which gets 
		// stored as a float and comes back with some lost precision
		var d = Ti.App.Properties.getDouble('Double')
		valueOf(Number(d).toPrecision(5)).shouldBe(Number(10.6).toPrecision(5));
		
		Titanium.App.Properties.setList('MyList',array);
		var list = Titanium.App.Properties.getList('MyList');
		for (var i=0;i<list.length;i++)
		{
			valueOf(list[i].name).shouldBe(array[i].name);
			valueOf(list[i].address).shouldBe(array[i].address);
		}
		
		Titanium.App.Properties.setObject('MyObject',object);
		var myObject = Titanium.App.Properties.getObject('MyObject');
		for (var k in object)
		{
			valueOf(myObject.hasOwnProperty(k) && object.hasOwnProperty(k)).shouldBe(true);
			valueOf(myObject[k]).shouldBe(object[k]);
		}

		// We set 6 properties above, so make sure listProperties() includes them.
		var propnames = ['String', 'Int', 'Bool', 'Double', 'MyList', 'MyObject'];
		var proplist = Ti.App.Properties.listProperties();
		valueOf(proplist.length).shouldBeGreaterThanEqual(propnames.length);
		for (var j = 0; j < propnames.length; j++) {
			valueOf(proplist.indexOf(propnames[j])).shouldBeGreaterThan(-1);
		}

		//
		// test out remove property and setting to null
		//
		Titanium.App.Properties.setString('String',null);
		valueOf(Ti.App.Properties.getString('String')).shouldBeNull();
		Titanium.App.Properties.removeProperty('Int');
		valueOf(Ti.App.Properties.getString('Int')).shouldBeNull();
	},

	doublePrecision: function() {
		var now = new Date();
		var time = now.getTime();
		Ti.App.Properties.setDouble('time', time);

		var value = Ti.App.Properties.getDouble('time');
		valueOf(value).shouldBe(time);
	}
});

