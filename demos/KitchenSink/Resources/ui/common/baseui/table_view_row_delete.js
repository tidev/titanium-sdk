function tv_row_delete(_args) {
	var isMobileWeb = Ti.Platform.osname === 'mobileweb',
		isTizen = Ti.Platform.osname === 'tizen',
		win = Titanium.UI.createWindow({
			title:_args.title
		});

	
	// create table view data object
	var data = [
		{title:'Row 1', hasChild:true},
		{title:'Row 2', hasDetail:true},
		{title:'Row 3 (no animation)', name:'foo'},
		{title:'Row 4 (no animation)', name:'bar'},
		{title:'Row 5'}
	];
	
	//
	// set right nav button
	//
	var button = Titanium.UI.createButton({
		title:'Delete Row'
	});
	if ( !(isMobileWeb || isTizen) ) {
		button.style = Titanium.UI.iPhone.SystemButtonStyle.BORDERED;
	}
	
	var tableViewOptions = {data: data};
	if (Titanium.Platform.name == 'iPhone OS') {
		win.rightNavButton = button;
	} else {
		button.top = 5;
		button.width = 300;
		button.height = 30;
		tableViewOptions.top = 45;
		win.add(button);
	}
	
	// create table view
	var tableview = Titanium.UI.createTableView(tableViewOptions);
	
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
	
	button.addEventListener('click', function()
	{
		var index = tableview.data.length-1;
		Ti.API.info("deleting row "+index);
		
		try {
			if ( !(isMobileWeb || isTizen) ) {
				tableview.deleteRow(index,{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.UP});
			} else {
				tableview.deleteRow(index);
			}
		} catch (E) {
			Ti.UI.createNotification({ message: E.message }).show();
		}
	});
	return win;
};

module.exports = tv_row_delete;