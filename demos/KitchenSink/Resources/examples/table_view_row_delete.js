var win = Titanium.UI.currentWindow;

// create table view data object
var data = [
	{title:'Row 1', hasChild:true},
	{title:'Row 2', hasDetail:true},
	{title:'Row 3 (no animation)', name:'foo'},
	{title:'Row 4 (no animation)', name:'bar'},
	{title:'Row 5'}
	

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
	
	Titanium.UI.createAlertDialog({title:'Table View',message:'row ' + row + ' index ' + index + ' section ' + section  + ' row data ' + rowdata}).show();		

});

// add table view to the window
win.add(tableview);

//
// set right nav button
//
var button = Titanium.UI.createButton({
	title:'Delete Row',
	style:Titanium.UI.iPhone.SystemButtonStyle.BORDERED
});
win.rightNavButton = button;

button.addEventListener('click', function()
{
	tableview.deleteRow((tableview.data.length-1),{animationStyle:Titanium.UI.iPhone.RowAnimationStyle.UP});
});
