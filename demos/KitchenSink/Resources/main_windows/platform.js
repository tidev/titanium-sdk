// create table view data object
var data = [
	{title:'XHR', hasChild:true, test:'../examples/xhr.js'},
	{title:'Network', hasChild:true, test:'../examples/network.js'},
	{title:'Logging', hasChild:true, test:'../examples/logging.js'},
	{title:'Application Data', hasChild:true, test:'../examples/app_data.js'},
	{title:'Application Events', hasChild:true, test:'../examples/app_events.js'},
	{title:'Properties API', hasChild:true, test:'../examples/properties.js'},
	{title:'Database', hasChild:true, test:'../examples/database.js'},
	{title:'Platform Data', hasChild:true, test:'../examples/platform.js'},
	{title:'Filesystem', hasChild:true, test:'../examples/filesystem.js'},
	{title:'JS Includes', hasChild:true, test:'../examples/js_include.js'},
	{title:'Passing Data (windows)', hasChild:true, test:'../examples/custom_properties.js'},
	{title:'Set Timeout (timer)', hasChild:true, test:'../examples/set_timeout.js'},
	{title:'Set Interval (timer)', hasChild:true, test:'../examples/set_interval.js'},
];
if (Titanium.Platform.name == 'iPhone OS')
{
	data.push({title:'XML DOM', hasChild:true, test:'../examples/xml_dom.js'});
	data.push({title:'XML RSS', hasChild:true, test:'../examples/xml_rss.js'});
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
		var win = Titanium.UI.createWindow({
			url:e.rowData.test,
			title:e.rowData.title
		});
		Titanium.UI.currentTab.open(win,{animated:true})
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
