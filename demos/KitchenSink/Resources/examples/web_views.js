var win = Titanium.UI.currentWindow;

// create table view data object
var data = [
	{title:'External URL', hasChild:true, url:'http://www.google.com'},
	{title:'Local URL', hasChild:true, url:'local_webview.html'},
	{title:'PDF URL', hasChild:true, url:'http://www.appcelerator.com/assets/The_iPad_App_Wave.pdf'},
	{title:'Image URL', hasChild:true, url:'http://www.appcelerator.com/wp-content/uploads/2010/01/TABWAVE_graph1.png'},
	{title:'SVG URL', hasChild:true, url:'http://upload.wikimedia.org/wikipedia/commons/5/55/1st_Cavalry_Division_-_Shoulder_Sleeve_Insignia.svg'}
];

// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	var rowdata = e.rowData;
	var w = Ti.UI.createWindow();
	var webview = Ti.UI.createWebView({url:rowdata.url});
	webview.addEventListener('load',function(e)
	{
		Ti.API.debug("webview loaded: "+e.url);
	})
	w.add(webview);
	win.tab.open(w);
	webview.evalJS('alert("hello")');
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
