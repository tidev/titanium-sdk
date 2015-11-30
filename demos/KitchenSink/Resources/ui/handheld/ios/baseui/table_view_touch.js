function tv_touch(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	// create table view data object
	var data = [];
	
	for (var x=0;x<4;x++)
	{
		//var view = Ti.UI.createView();
		var label = Ti.UI.createLabel({
			text:'Row Label ' + x,
			height:Ti.UI.SIZE,
			width:Ti.UI.SIZE,
			color:'#336699',
			left:10
		});
		var row = Ti.UI.createTableViewRow({height:50});
		//view.add(label);
		row.add(label);
		data.push(row);
	}
	
	// create table view
	var tableview = Titanium.UI.createTableView({
		data:data
	});
	
	tableview.addEventListener('touchstart', function(e)
	{
		e.row.children[0].color = '#fff';
	});
	
	tableview.addEventListener('touchend', function(e)
	{
		e.row.children[0].color = '#336699';
	});
	
	tableview.addEventListener('touchcancel', function(e)
	{
		e.row.children[0].color = '#336699';
	});
	
	// add table view to the window
	win.add(tableview);
	return win;
};

module.exports = tv_touch;