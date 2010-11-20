// create table view data object
var data = [
	/*
	{title:'Error Callback', hasChild:true, test:'../examples/xhr_error.js'},
	{title:'Binary Data', hasChild:true, test:'../examples/xhr_binarydata.js'},
	*/
	{title:'XML Data', hasChild:true, test:'../examples/xhr_xml.js'},
	/*
	{title:'XML Properties', hasChild:true, test:'../examples/xhr_properties.js'},
	{title:'File Download', hasChild:true, test:'../examples/xhr_filedownload.js'},
	{title:'UTF-8 + GET/POST', hasChild:true, test:'../examples/xhr_utf8.js'},
	{title:'Cookies', hasChild:true, test:'../examples/xhr_cookie.js'},
	{title:'setTimeout', hasChild:true, test:'../examples/xhr_settimeout.js'}
	*/
];
// add iphone specific tests
if (Titanium.Platform.name == 'iPhone OS')
{
	//data.push({title:'File Upload', hasChild:true, test:'../examples/xhr_fileupload.js'});
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

