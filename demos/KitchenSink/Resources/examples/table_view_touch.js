// create table view data object
var data = [];

for (var x=0;x<4;x++)
{
	var label = Ti.UI.createLabel({
		text:'Row Label ' + x,
		height:'auto',
		width:'auto',
		color:'#336699',
		left:10
	});
	var row = Ti.UI.createTableViewRow({height:50});
	row.add(label);
	data.push(row);
}

// create table view
var tableview = Titanium.UI.createTableView({
	data:data,
});

tableview.addEventListener('touchstart', function(e)
{
	e.row.children[0].color = '#fff';
});

tableview.addEventListener('touchend', function(e)
{
	e.row.children[0].color = '#336699';
});


// add table view to the window
Titanium.UI.currentWindow.add(tableview);
