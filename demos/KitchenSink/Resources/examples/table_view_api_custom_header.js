// create table view data object
var data = [];

var header = Ti.UI.createView({
	backgroundColor:'#999',
	height:'auto'
});

var headerLabel = Ti.UI.createLabel({
	font:{fontFamily:'Helvetica Neue',fontSize:18,fontWeight:'bold'},
	text:'Custom Header - first label',
	color:'#222',
	textAlign:'left',
	top:0,
	left:10,
	width:300,
	height:30
});
var headerLabel2 = Ti.UI.createLabel({
	font:{fontFamily:'Helvetica Neue',fontSize:18,fontWeight:'bold'},
	text:'Custom Header - second label',
	color:'#222',
	textAlign:'left',
	left:10,
	top:50,
	width:300,
	height:30
});
header.add(headerLabel);
header.add(headerLabel2);

var section = Ti.UI.createTableViewSection();
section.headerView = header;

data[0] = section;

section.add(Ti.UI.createTableViewRow({hasChild:true,title:'Row 1'}));
section.add(Ti.UI.createTableViewRow({hasDetail:true,title:'Row 2'}));
section.add(Ti.UI.createTableViewRow({hasCheck:true,title:'Row 3'}));
section.add(Ti.UI.createTableViewRow({title:'Row 4'}));

// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	// event data
	var index = e.index;
	var section = e.section;
	var row = e.row;
	var rowdata = e.rowData;
	Titanium.UI.createAlertDialog({title:'Table View',message:'row ' + row + ' index ' + index + ' section ' + section  + ' row data ' + rowdata}).show();
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
