var win = Titanium.UI.currentWindow;

var l = Titanium.UI.createLabel({
	text:'See Log for output',
	height:'auto',
	width:'auto'
});
win.add(l);

var array = [
	{name:'Name 1', address:'1 Main St'},
	{name:'Name 2', address:'2 Main St'},
	{name:'Name 3', address:'3 Main St'},
	{name:'Name 4', address:'4 Main St'}	
];

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
Titanium.API.info("String should be null - value = " + Titanium.App.Properties.getString('String'));
Titanium.API.info("Int should be null - value = " + Titanium.App.Properties.getString('Int'));

//
// application settings testing
//
if (Titanium.Platform.name != 'android')
{
	Titanium.API.info("AppSetting Name = " + Titanium.App.Properties.getString('name_preference'));
	Titanium.API.info("AppSetting Enabled = " + Titanium.App.Properties.getString('enabled_preference'));
	Titanium.API.info("AppSetting Slider = " + Titanium.App.Properties.getString('slider_preference'));
}
