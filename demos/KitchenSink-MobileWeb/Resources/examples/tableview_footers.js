// create table view data object
var data = [
	{title:'Alan', hasChild:true, header:'header'},
	{title:'Alice', hasDetail:true},
	{title:'Alexander', hasCheck:true},
	{title:'Amos'},
	{title:'Alonzo', footer:'footer'},
];

// create table view
var tableview = Titanium.UI.createTableView({
	data:data,
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

var closeButton = Ti.UI.createButton({
	title:'Close Window',
	height:40,
	width:300,
	left:10,
	font:{fontSize:20}
});

closeButton.addEventListener('click', function(){
	Titanium.UI.currentWindow.close();
});

Ti.UI.currentWindow.add(closeButton);
