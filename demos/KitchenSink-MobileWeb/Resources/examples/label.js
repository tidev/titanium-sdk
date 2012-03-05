Ti.UI.setBackgroundColor('#eee');
var win = Titanium.UI.currentWindow;
// create table view data object
var data = [
	{title:'Basic', hasChild:true, test:'/examples/label_basic.js'},
	{title:'Advanced', hasChild:true, test:'/examples/label_advanced.js'},
	{title:'Animate', hasChild:true, test:'/examples/label_animate.js'}
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
Titanium.UI.currentWindow.add(tableview);

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	top:180,
	left:10,
	font:{fontSize:20}
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});

win.add(closeButton);
