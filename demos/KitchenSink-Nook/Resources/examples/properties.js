var win = Titanium.UI.currentWindow;

/**
 * Result helper for checking a result against an expected value
 * @param result The result to test
 * @param expected The expected result
 * @return String Indicating Success or Failure
 */
function resultHelper(result, expected) {
			
	if (result instanceof Array) {
		var sourceResult = JSON.stringify(result);
		var expectedResult = JSON.stringify(expected);
		
		return resultHelper(sourceResult, expectedResult);
	} 
	
	if (result == expected) {
		return "Test Success ("+result+"=="+expected+")";
	} else {
		return "Test Failure: result (" + result + ") != expected (" + expected + ")";
	}
}


var l = Titanium.UI.createLabel({
	text:'See Log for output',
	height:'auto',
	width:'auto',
	font: {
		fontSize: 24	
	}
});
win.add(l);

var array = [
	{name:'Name 1', address:'1 Main St'},
	{name:'Name 2', address:'2 Main St'},
	{name:'Name 3', address:'3 Main St'},
	{name:'Name 4', address:'4 Main St'}	
];

//
// Test Default handling
//

//Valid Defaults
Titanium.API.debug('Bool: ' + resultHelper(Ti.App.Properties.getBool('whatever',true),true));
Titanium.API.debug('Double: ' + resultHelper(Ti.App.Properties.getDouble('whatever',2.5),2.5));
Titanium.API.debug('int: ' + resultHelper(Ti.App.Properties.getInt('whatever',1),1));
Titanium.API.debug('String: ' + resultHelper(Ti.App.Properties.getString('whatever',"Fred"),"Fred"));

// First StringList Test
var defaultString = new Array("testOne","testTwo");

Titanium.API.debug('StringList-1: ' + resultHelper(Ti.App.Properties.getList('whatever',defaultString),defaultString));
// Second StringList Test
defaultString = new Array();
Titanium.API.debug('StringList-2: ' + resultHelper(Ti.App.Properties.getList('whatever',defaultString),defaultString));


//No Defaults
Titanium.API.debug('Bool: ' + resultHelper(Ti.App.Properties.getBool('whatever'),null));
Titanium.API.debug('Double: ' + resultHelper(Ti.App.Properties.getDouble('whatever'),null));
Titanium.API.debug('int: ' + resultHelper(Ti.App.Properties.getInt('whatever'),null));
Titanium.API.debug('String: ' + resultHelper(Ti.App.Properties.getString('whatever'),null));

Titanium.API.debug('StringList: ' + resultHelper(Ti.App.Properties.getList('whatever'),null));

//
// Round-trip tests
//
//
// test setters
//
Titanium.App.Properties.setString('String','I am a String Value ');
Titanium.App.Properties.setInt('Int',10);
Titanium.App.Properties.setBool('Bool',true);
Titanium.App.Properties.setDouble('Double',10.6);
Titanium.App.Properties.setList('MyList',array);

//
// test getters
//
Titanium.API.info('String: '+ Titanium.App.Properties.getString('String'));
Titanium.API.info('Int: '+ Titanium.App.Properties.getString('Int'));
Titanium.API.info('Bool: '+ Titanium.App.Properties.getString('Bool'));
Titanium.API.info('Double: '+ Titanium.App.Properties.getString('Double'));
Titanium.API.info('List:');

var list = Titanium.App.Properties.getList('MyList');
for (var i=0;i<list.length;i++)
{
	Titanium.API.info('row['+i+'].name=' + list[i].name + ' row['+i+'].address=' + list[i].address );
}

//
//  test listProperties
//
var props = Titanium.App.Properties.listProperties();
for (var i=0;i<props.length;i++)
{
	Titanium.API.info('property: ' + props[i]);
}
//
// test out remove property and setting to null
//
Titanium.App.Properties.setString('String',null);
Titanium.App.Properties.removeProperty('Int');
Titanium.API.info("String should be null - value = " + resultHelper(Titanium.App.Properties.getString('String'),null));
Titanium.API.info("Int should be null - value = " + resultHelper(Titanium.App.Properties.getString('Int'),null));

//
// application settings testing
//
if (Titanium.Platform.name != 'android')
{
	Titanium.API.info("AppSetting Name = " + Titanium.App.Properties.getString('name_preference'));
	Titanium.API.info("AppSetting Enabled = " + Titanium.App.Properties.getString('enabled_preference'));
	Titanium.API.info("AppSetting Slider = " + Titanium.App.Properties.getString('slider_preference'));
}
