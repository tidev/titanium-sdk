// create table view data object
var data = [
	{title:'XHR', hasChild:true, test:'../examples/xhr.js'},
	{title:'Network', hasChild:true, test:'../examples/network.js'},
	{title:'Common JS', hasChild:true, test:'../examples/commonjs.js'},
	{title:'Logging', hasChild:true, test:'../examples/logging.js'},
	{title:'Application Data', hasChild:true, test:'../examples/app_data.js'},
	{title:'Application Events', hasChild:true, test:'../examples/app_events.js'},
	{title:'Properties API', hasChild:true, test:'../examples/properties.js'},
	{title:'Database', hasChild:true, test:'../examples/database.js'},
	{title:'Platform Data', hasChild:true, test:'../examples/platform.js'},
	{title:'Filesystem', hasChild:true, test:'../examples/filesystem.js'},
	{title:'JS Includes', hasChild:true, test:'../examples/js_include.js'},
	{title:'Set Timeout (timer)', hasChild:true, test:'../examples/set_timeout.js'},
	{title:'Set Interval (timer)', hasChild:true, test:'../examples/set_interval.js'},
	{title:'XML DOM', hasChild:true, test:'../examples/xml_dom.js'},
	{title:'XML RSS', hasChild:true, test:'../examples/xml_rss.js'},
	{title:'Utils', hasChild:true, test:'../examples/utils.js'},
	{title:'JSON', hasChild:true, test:'../examples/json.js'},
	{title:'JS search', hasChild:true, test:'../examples/search_case_insensitive.js'}

];

if (Titanium.Platform.name == 'iPhone OS')
{
	data.push({title:'Passing Data (windows)', hasChild:true, test:'../examples/custom_properties.js'});
	data.push({title:'Bonjour', hasChild:true, test:'../examples/bonjour.js'});
	data.push({title:'Sockets', hasChild:true, test:'../examples/sockets.js'});
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
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
