// create table view data object
var data = [
	{title:'Row 1', hasChild:true, foo:'123'},
	{title:'Row 2', hasDetail:true, foo:'456'},
	{title:'Row 3', foo:'789'},
	{title:'Row 4', foo:'101112'}
	

];

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
	
	// custom property
	var prop = e.rowData.foo;
	
	Titanium.UI.createAlertDialog({title:'Table View',message:'custom value ' + prop}).show();
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
