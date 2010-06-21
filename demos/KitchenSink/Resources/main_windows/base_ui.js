// create table view data object
var data = [
	{title:'Tab Groups', hasChild:true, test:'../examples/tab_groups.js'},
	{title:'Window Properties', hasChild:true, test:'../examples/window_properties.js'},
	{title:'Window Layout', hasChild:true, test:'../examples/window_layout.js'},
	{title:'Window (Standalone)', hasChild:true, test:'../examples/window_standalone.js'},
	{title:'Views', hasChild:true, test:'../examples/views.js'},
	{title:'Custom Events', hasChild:true, test:'../examples/custom_events.js'},
	{title:'Window Events', hasChild:true, test:'../examples/window_events.js'},
	{title:'Vertical Layout', hasChild:true, test:'../examples/vertical_layout.js'}
];

// add iphone specific tests
if (Titanium.Platform.name == 'iPhone OS')
{
	data.push({title:'Tabs', hasChild:true, test:'../examples/tabs.js'});
	data.push({title:'Window NavBar', hasChild:true, test:'../examples/window_navbar.js'});
	data.push({title:'Window Toolbar', hasChild:true, test:'../examples/window_toolbar.js'});
	data.push({title:'Window Constructor', hasChild:true, test:'../examples/window_constructor.js'});
	data.push({title:'Animation', hasChild:true, test:'../examples/animation.js'});
	data.push({title:'Horizontal Layout', hasChild:true, test:'../examples/horizontal_layout.js'});
	data.push({title:'Nav Group', hasChild:true, test:'../examples/navgroup.js'});
	
	Ti.include("../examples/version.js");
	
	if (isIPhone3_2_Plus())
	{
		data.push({title:'Modal Windows', hasChild:true, test:'../examples/modal_windows.js'});
	}
}

// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	if (e.rowData.test)
	{
		var win = null;
		if (Ti.Platform.name == "android") {
			win = Titanium.UI.createWindow({
				url:e.rowData.test,
				title:e.rowData.title
			});	
		} else {
			win = Titanium.UI.createWindow({
				url:e.rowData.test,
				title:e.rowData.title,
				backgroundColor:'#fff',
				barColor:'#111'
				
			});
		}
		
		
		if (e.index == 3)
		{
			win.hideTabBar();
		}
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);

Titanium.UI.currentWindow.addEventListener('focus', function()
{
	Ti.API.info('FOCUS RECEIVED IN base_ui');
})
//
//  ADD EVENT LISTENERS FOR CUSTOM EVENTS
//
var win = Titanium.UI.createWindow({
	height:30,
	width:250,
	bottom:110,
	borderRadius:10
});

var view = Titanium.UI.createView({
	backgroundColor:'#000',
	opacity:0.7,
	height:30,
	width:250,
	borderRadius:10
});

var label = Titanium.UI.createLabel({
	color:'#fff',
	font:{fontSize:13},
	textAlign:'center',
	width:'auto',
	height:'auto'
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
	label.text = 'base_ui.js: event two, name = ' + e.name;
	win.open();
	setTimeout(function()
	{
		win.close({opacity:0,duration:500});
	},1000);
	
});


