function tv_api_group(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	// create table view data object
	var data = [];
	
	for (var c=0;c<4;c++)
	{
		data[c] = Ti.UI.createTableViewSection({headerTitle:'Group '+(c+1)});
		for (var x=0;x<10;x++)
		{
			data[c].add(Ti.UI.createTableViewRow({title:'Group '+(c+1)+', Row '+(x+1)}));
		}
	}
	
	// create table view
	var tableview = Titanium.UI.createTableView({
		data:data,
		style: Titanium.UI.iPhone.TableViewStyle.GROUPED
	});
	
	// create table view event listener
	tableview.addEventListener('click', function(e)
	{
		// event data
		var index = e.index;
		var section = e.section;
		var row = e.row;
		var rowdata = e.rowData;
		if (section.headerTitle.indexOf('clicked')==-1)
		{
			section.headerTitle = section.headerTitle + ' (clicked)';
		}
		Titanium.UI.createAlertDialog({title:'Table View',message:'row ' + row + ' index ' + index + ' section ' + section  + ' row data ' + rowdata}).show();
	});
	
	// add table view to the window
	win.add(tableview);
	return win;
};

module.exports = tv_api_group;