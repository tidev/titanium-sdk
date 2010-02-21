// create table view data object
var data = [];

var footer = Ti.UI.createView({
	backgroundColor:'#111',
	height:20
});

var footerLabel = Ti.UI.createLabel({
	font:{fontFamily:'Helvetica Neue',fontSize:18,fontWeight:'bold'},
	text:'Custom Footer',
	color:'#191',
	textAlign:'left',
	left:10,
	width:'auto',
	height:'auto'
});

footer.add(footerLabel);

var section = Ti.UI.createTableViewSection();
section.footerView = footer;

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
