var win = Titanium.UI.currentWindow;
win.backgroundColor = '#000099';

// create table view data object
var data = [];

data[0] = Ti.UI.createTableViewRow({title:'Row 1',backgroundColor:'#900'});
data[1] = Ti.UI.createTableViewRow({title:'Row 2',backgroundColor:'#fff'});
data[2] = Ti.UI.createTableViewRow({title:'Row 3',backgroundColor:'#900'});
data[3] = Ti.UI.createTableViewRow({title:'Row 4',backgroundColor:'#fff'});

// create table view
var tableview = Titanium.UI.createTableView({
	data:data,
	bottom:30,
	left:20,
	right:20,
	height:178,
	borderWidth:2,
	borderRadius:10,
	borderColor:'#222'
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	// event data
	var index = e.index;
	var section = e.section;
	var row = e.row;
	var rowdata = e.rowData;
	row.hasCheck = true;
	var color = '#' + String(Math.round(Math.random()*9)) + String(Math.round(Math.random()*9)) + String(Math.round(Math.random()*9));
	row.title = "Color is now: "+color;
	row.backgroundColor = color;
	//Titanium.UI.createAlertDialog({title:'Table View',message:'row ' + row + ' index ' + index + ' section ' + section  + ' row data ' + rowdata}).show();
});

// add table view to the window
win.add(tableview);

var label = Titanium.UI.createLabel({
	top:20,
	font:{fontFamily:'Helvetica Neue',fontSize:20},
	text:'Tableviews are cool',
	color:'#900',
	shadowColor:'#555',
	shadowOffset:{x:1,y:2},
	textAlign:'center',
	width:'auto',
	height:'auto'
});


win.add(label);