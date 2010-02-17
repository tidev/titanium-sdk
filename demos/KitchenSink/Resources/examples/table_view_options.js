var data = [];

data[0] = Ti.UI.createTableViewRow({title:'Row 1'});
data[1] = Ti.UI.createTableViewRow({title:'Row 2'});
data[2] = Ti.UI.createTableViewRow({hasCheck:true,title:'Row 3'});
data[3] = Ti.UI.createTableViewRow({title:'Row 4'});

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
	
	// reset checks
	for (var i=0;i<section.rows.length;i++)
	{
		section.rows[i].hasCheck = false;
	}
	// set current check
	section.rows[index].hasCheck = true;
});

// add table view to the window
var win = Ti.UI.currentWindow;
win.add(tableview);

win.open();
