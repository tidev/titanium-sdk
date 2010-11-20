// create table view data object
var data = [];

data[0] = Ti.UI.createTableViewRow({hasChild:true,title:'Row 1'});
data[1] = Ti.UI.createTableViewRow({hasDetail:true,title:'Row 2'});
data[2] = Ti.UI.createTableViewRow({hasCheck:true,title:'Row 3'});
data[3] = Ti.UI.createTableViewRow({title:'Row 4'});

// create table view with empty data set and then append
var tableview = Titanium.UI.createTableView();
tableview.data = data;


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
