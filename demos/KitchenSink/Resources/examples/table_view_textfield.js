var win = Ti.UI.currentWindow;

function addRow()
{
	var row = Ti.UI.createTableViewRow({height:50});
	var tf1 = Titanium.UI.createTextField({
		color:'#336699',
		height:35,
		top:10,
		left:10,
		width:250,
		borderStyle:Titanium.UI.INPUT_BORDERSTYLE_ROUNDED
	});	
	row.add(tf1);
	row.selectionStyle = Ti.UI.iPhone.TableViewCellSelectionStyle.NONE;
	row.className = 'control';
	return row;
}

// create table view data object
var data = [];

for (var x=0;x<10;x++)
{
	data[x] = addRow();
}

var tableView = Ti.UI.createTableView({
	data:data, 	
	style: Titanium.UI.iPhone.TableViewStyle.GROUPED
});

win.add(tableView);