Ti.include('../common.js');

// create table view data object
var data = [
	{title:'Tab Groups', test:'../examples/tab_groups.js'},
	{title:'Window Properties', test:'../examples/window_properties.js'},
	{title:'Window Layout', test:'../examples/window_layout.js'},
	{title:'Window (Standalone)', test:'../examples/window_standalone.js'},
	{title:'Views', test:'../examples/views.js'},
	{title:'Custom Events', test:'../examples/custom_events.js'},
	{title:'Window Events', test:'../examples/window_events.js'},
	{title:'Vertical Layout', test:'../examples/vertical_layout.js'},
	{title:'Horizontal Layout', test:'../examples/horizontal_layout.js'},
	//{title:'Preferences', test:'../examples/preferences.js'},
	{title:'Hide Soft Keyboard', test:'../examples/android_hide_softkeyboard.js'},
	{title: 'Window Soft Input', test:'../examples/android_window_soft_input_mode.js'},
	{title: 'Menu', test:'../examples/android_menus.js'}
];
NookKS.formatTableView(data);

// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	if (e.rowData.test)
	{
		var win = Titanium.UI.createWindow({
			url:e.rowData.test,
			title:e.rowData.title
		});

		if (Ti.Platform.name==='android' && e.rowData.test.indexOf('window_properties.js') >= 0) {
			// As explained in apidoc for Window, if opacity is ever to be changed for an Android
			// activity during its lifetime, it needs to use a translucent background.  We trigger
			// using a translucent theme by the presence of the opacity property, so we need to
			// set it here.  Setting it to 1 means it's totally opaque, but gives us the property to
			// make it more transparent later with the "toggle opacity" test.
			win.backgroundColor = "#191919"
			win.opacity = 1;
		}
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);

Titanium.UI.currentWindow.addEventListener('focus', function()
{
	Ti.API.info('FOCUS RECEIVED IN base_ui');
	Ti.API.info(Ti.dumpCoverage());
});
//
//  ADD EVENT LISTENERS FOR CUSTOM EVENTS
//
var win = Titanium.UI.createWindow({
	height:50,
	width:580,
	bottom:110,
	borderRadius:10
});

var view = Titanium.UI.createView({
	backgroundColor:'#555',
	opacity:0.7,
	height:50,
	width:580,
	borderRadius:10
});

var label = Titanium.UI.createLabel({
	color:'#fff',
	textAlign:'center',
	width:580,
	height:'auto',
	font: {
		fontSize: 24	
	}
});
win.add(view);
win.add(label);

Titanium.App.addEventListener('event_one', function(e)
{
	label.text = 'base_ui.js: event one, array length = ' + e.data.length;
	win.open();
	setTimeout(function()
	{
		win.close({opacity:0,duration:500});
	},1000);
});

Titanium.App.addEventListener('event_two', function(e)
{
	label.text = 'base_ui.js: event two, name = ' + e.name + ', city = ' + e.city;
	win.open();
	setTimeout(function()
	{
		win.close({opacity:0,duration:500});
	},1000);

});


