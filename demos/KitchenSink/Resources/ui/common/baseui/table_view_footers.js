function tv_footers(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	// create table view data object
	var data = [
		{title:'Alan', hasChild:true, header:'header'},
		{title:'Alice', hasDetail:true},
		{title:'Alexander', hasCheck:true},
		{title:'Amos'},
		{title:'Alonzo', footer:'footer'}
	];
	
	// create table view
	var tableview = Titanium.UI.createTableView({
		data:data
	});
	
	function showClickEventInfo(e, islongclick) {
		// event data
		var index = e.index;
		var section = e.section;
		var row = e.row;
		var rowdata = e.rowData;
		var msg = 'row ' + row + ' index ' + index + ' section ' + section  + ' row data ' + rowdata;
		if (islongclick) {
			msg = "LONGCLICK " + msg;
		}
		Titanium.UI.createAlertDialog({title:'Table View',message:msg}).show();
	}
	
	// create table view event listener
	tableview.addEventListener('click', function(e)
	{
		showClickEventInfo(e);
	});
	tableview.addEventListener('longclick', function(e)
	{
		showClickEventInfo(e, true);
	});
	// add table view to the window
	win.add(tableview);
	return win;
};

module.exports = tv_footers;