var win = Titanium.UI.currentWindow;
// create table view data object
var data = [
	{title:'Basic', hasChild:true, test:'/examples/switch_basic.js'},
	{title:'Switch all', hasChild:true, test:'/examples/switch_all.js'},
	{title:'Switch properties', hasChild:true, test:'/examples/switch_properties.js'},

];

// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	if (e.rowData.test) {
		var w = Ti.UI.createWindow({url:e.rowData.test});
		w.open();
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top:160,
	left:10,
	font:{fontSize:20}
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});

win.add(closeButton);
