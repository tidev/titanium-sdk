function tv_options(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	var data = [];
	
	var lastIndex = 3;
	
	for (var i=0;i<4;i++)
	{
		var row = Ti.UI.createTableViewRow();
		
		var l = Ti.UI.createLabel({
			left:5,
			font:{fontSize:20, fontWeight:'bold'},
			color:'#000',
			text:'Label ' + i
		});
		row.add(l);
		if (i==3)
		{
			row.hasCheck=true;
			l.color = '#336699';
		}
		data[i] = row;
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
		
		if(index != lastIndex) {
			section.rows[lastIndex].hasCheck = false;
			section.rows[lastIndex].children[0].color = '#000';
			lastIndex = index;
			section.rows[lastIndex].hasCheck = true;
			section.rows[lastIndex].children[0].color = '#336699';
		}
	});
	
	// add table view to the window
	win.add(tableview);
	
	return win;
};

module.exports = tv_options;