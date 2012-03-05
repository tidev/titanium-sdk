var win = Titanium.UI.currentWindow;
// create table view data object
var data = [
	
	{title:'Error Callback', hasChild:true, test:'/examples/xhr_error.js'},
	{title:'Binary Data', hasChild:true, test:'/examples/xhr_binarydata.js'},
	{title:'XML Data', hasChild:true, test:'/examples/xhr_xml.js'},
	// {title:'XML Properties', hasChild:true, test:'/examples/xhr_properties.js'},
	// {title:'File Download', hasChild:true, test:'/examples/xhr_filedownload.js'},
	// {title:'UTF-8 + GET/POST', hasChild:true, test:'/examples/xhr_utf8.js'},
	// {title:'Cookies', hasChild:true, test:'/examples/xhr_cookie.js'},
	{title:'setTimeout', hasChild:true, test:'/examples/xhr_settimeout.js'}
];

// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	if (e.rowData.test) {
		var w = Ti.UI.createWindow({backgroundColor:'#a9a9a9',url:e.rowData.test});
		w.open();
	}
});

// add table view to the window
win.add(tableview);

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top:280,
	left:10,
	font:{fontSize:20}
});

closeButton.addEventListener('click', function()
{
	Titanium.UI.currentWindow.close();
});

win.add(closeButton);

