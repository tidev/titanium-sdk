var win = Titanium.UI.currentWindow;

// create table view data object
var data = [
	{title:'External URL', hasChild:true, url:'http://www.google.com'},
	{title:'Local URL', hasChild:true, url:'local_webview.html'},
	{title:'PDF URL', hasChild:true, url:'http://www.appcelerator.com/assets/The_iPad_App_Wave.pdf'},
	{title:'Image URL', hasChild:true, url:'http://www.appcelerator.com/wp-content/uploads/2010/01/TABWAVE_graph1.png'},
	{title:'SVG URL', hasChild:true, url:'http://upload.wikimedia.org/wikipedia/commons/5/55/1st_Cavalry_Division_-_Shoulder_Sleeve_Insignia.svg'},
	{title:'Inline HTML', hasChild:true, text:'<html><body>Hello from inline HTML.</body></html>'},
	{title:'Inline HTML w/ Trans Bg', hasChild:true, text:'<html><body><div style="color:white;">Hello from inline HTML. You should see white text and black background</div></body></html>', bgcolor:'black'},
	{title:'Inline HTML w/ Color Bg', hasChild:true, text:'<html><body><div style="color:red;">Hello from inline HTML. You should see red text and yellow background</div></body></html>', bgcolor:'yellow'},
	{title:'Inline HTML w/ Border', hasChild:true, text:'<html><body><div>Hello from inline HTML. You should see red border</div></body></html>', border: true},
	{title:'Logging and Unicode', hasChild:true, url:'webview_logging.html'},
	{title:'Local Pinch/Zoom', hasChild:true, url:'local_webview_pinchzoom.html', scale:true},
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
	var webview = Ti.UI.createWebView();
	if (rowdata.url)
	{
		webview.url = rowdata.url;
	}
	else
	{
		webview.html = rowdata.text;
	}
	if (rowdata.scale)
	{
		// override the default pinch/zoom behavior of local (or remote) webpages
		// and either allow pinch/zoom (set to true) or not (set to false)
		webview.scalesPageToFit = true;
	}
	webview.addEventListener('load',function(e)
	{
		Ti.API.debug("webview loaded: "+e.url);
	});
	if (rowdata.bgcolor)
	{
		webview.backgroundColor = rowdata.bgcolor;
	}
	if (rowdata.border)
	{
		webview.borderRadius=15;
		webview.borderWidth=5;
		webview.borderColor = 'red';
	}
	w.add(webview);
	win.tab.open(w);
	//webview.evalJS('alert("hello")');
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
