var win = Titanium.UI.currentWindow;
// create table view data object
var data = [
	
	{title:'Parse XML document', hasChild:true, test:'/examples/xml_dom.js'},
	{title:'Get RSS data', hasChild:true, test:'/examples/xml_rss.js'},
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
	top:110,
	left:10,
	font:{fontSize:20}
});

closeButton.addEventListener('click', function()
{
	Titanium.UI.currentWindow.close();
});

win.add(closeButton);
