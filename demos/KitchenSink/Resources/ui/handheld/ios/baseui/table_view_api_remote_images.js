function tv_api_remote(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	// create table view data object
	var data = [];
	
	for (var c=0; c<10; c++) 
	{
		var row = Ti.UI.createTableViewRow({height:100});
		
		var label = Ti.UI.createLabel({
			text: 'Cell at row ' + (c+1),
			color: '#111',
			shadowColor:'#900',
			shadowOffset:{x:0,y:1},
			textAlign:'left',
			left:130,
			font:{fontWeight:'bold',fontSize:18},
			width:Ti.UI.SIZE,
			height:Ti.UI.SIZE
		});
		row.add(label);
		
	
		var i = Ti.UI.createImageView({
			image: "http://static.appcelerator.com/images/header/appc_logo.png",
			top: 10,
			left: 0,
			width:125,
			height:89
		});
	
		row.add(i);
		
		data[c] = row;
	}
	
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
	win.add(tableview);
	return win;
};

module.exports = tv_api_remote;

