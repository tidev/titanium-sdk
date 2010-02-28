var win = Ti.UI.currentWindow;

var clickLabel = Ti.UI.createLabel({
	top:0,
	height:'auto',
	textAlign:'center',
	font:{fontSize:13},
	color:'#777'
});
win.add(clickLabel);

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
	
	tf1.addEventListener('change', function(e)
	{
		clickLabel.text = 'Text field changed to ' + e.value + ' at ' + new Date();
	});
	row.className = 'control';
	return row;
}

// create table view data object
var data = [];

for (var x=1;x<10;x++)
{
	data[x] = addRow();
}

var tableView = Ti.UI.createTableView({
	data:data, 	
	style: Titanium.UI.iPhone.TableViewStyle.GROUPED,
	top:50
});
tableView.addEventListener('click', function()
{
	clickLabel.text = 'row clicked at ' + new Date();
	
});
win.add(tableView);