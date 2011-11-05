Ti.include('../common.js');

// create table view data object
var data = [
	{title:'XHR', test:'../examples/xhr.js'},
	{title:'Network', test:'../examples/network.js'},
	{title:'Common JS', test:'../examples/commonjs.js'},
	{title:'Logging', test:'../examples/logging.js'},
	{title:'Application Data', test:'../examples/app_data.js'},
	{title:'Application Events', test:'../examples/app_events.js'},
	{title:'Properties API', test:'../examples/properties.js'},
	{title:'Database', test:'../examples/database.js'},
	{title:'Platform Data', test:'../examples/platform.js'},
	{title:'Filesystem', test:'../examples/filesystem.js'},
	{title:'JS Includes', test:'../examples/js_include.js'},
	{title:'Set Timeout (timer)', test:'../examples/set_timeout.js'},
	{title:'Set Interval (timer)', test:'../examples/set_interval.js'},
	{title:'XML RSS', test:'../examples/xml_rss.js'},
	{title:'Utils', test:'../examples/utils.js'},
	{title:'JSON', test:'../examples/json.js'},
	{title:'JS search', test:'../examples/search_case_insensitive.js'},
	{title:'Clipboard', test:'../examples/clipboard.js'},
	{title:'Sockets', test:'../examples/sockets.js'},
	{title: 'Android services', test:'../examples/android_services.js'}
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
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
