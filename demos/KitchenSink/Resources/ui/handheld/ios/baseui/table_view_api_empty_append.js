function tv_api_append(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	// create table view with empty data set and then append
	var tableview = Titanium.UI.createTableView();
	
	// append to row
	tableview.appendRow({hasChild:true,title:'Row 1 as Dictionary',header:'Header'});
	tableview.appendRow({hasChild:true,title:'Row 2 as Dictionary'});
	tableview.appendRow({hasChild:true,title:'Row 3 as Dictionary'});
	tableview.appendRow({hasChild:true,title:'Row 4 as Dictionary',footer:'Footer'});
	
	// now append with object
	tableview.appendRow(Ti.UI.createTableViewRow({hasChild:true,title:'Row 1 as API'}));
	tableview.appendRow(Ti.UI.createTableViewRow({hasDetail:true,title:'Row 2 as API'}));
	tableview.appendRow(Ti.UI.createTableViewRow({hasCheck:true,title:'Row 3 as API'}));
	tableview.appendRow(Ti.UI.createTableViewRow({title:'Row 4 as API'}));
	
	
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
	win.add(tableview);
	return win;
};

module.exports = tv_api_append;