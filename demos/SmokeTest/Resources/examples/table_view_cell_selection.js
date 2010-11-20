// create table view data object
var data = [];

data[0] = Ti.UI.createTableViewRow({hasChild:true,title:'No cell selection',selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.NONE});
data[1] = Ti.UI.createTableViewRow({hasDetail:true,title:'Blue cell selection',selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.BLUE});
data[2] = Ti.UI.createTableViewRow({hasCheck:true,title:'Gray cell selection',selectionStyle:Ti.UI.iPhone.TableViewCellSelectionStyle.GRAY});
data[3] = Ti.UI.createTableViewRow({title:'Default cell selection'});

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


