// create table view data object
var data = [];

for (var c=0;c<10;c++)
{
	data[c] = Ti.UI.createTableViewSection({headerTitle:'Group '+(c+1)});
	for (var x=0;x<40;x++)
	{
		var label = Ti.UI.createLabel({
			text:'Group '+(c+1)+', Row '+(x+1),
			left:10
		});
		var rightButton = Titanium.UI.createButton({
			style:Titanium.UI.iPhone.SystemButton.INFO_DARK,
			right:10,
			width:50,
			height:50
		});
		var row = Ti.UI.createTableViewRow();
		row.add(label);
		row.add(rightButton);
		data[c].add(row);
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
	Titanium.UI.createAlertDialog({title:'Table View',message:'row ' + row + ' index ' + index + ' section ' + section  + ' row data ' + rowdata}).show();
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
