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
		width:'auto',
		height:'auto'
	});
	row.add(label);
	

	var i = Ti.UI.createImageView({
		image: "http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png",
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
Titanium.UI.currentWindow.add(tableview);


