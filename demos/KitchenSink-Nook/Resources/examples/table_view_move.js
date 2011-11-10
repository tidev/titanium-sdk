var win = Titanium.UI.currentWindow;

// create table view data object
var data = [
	{title:'Row 1', hasChild:true},
	{title:'Row 2', hasDetail:true},
	{title:'Row 3'},
	{title:'Row 4'},
	{title:'Row 5'},
	{title:'Row 6'},
	{title:'Row 7'}
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
	Titanium.API.info("row - row index = "+row+", row section = "+row);
	Titanium.UI.createAlertDialog({title:'Table View',message:'row ' + row + ' index ' + index + ' section ' + section  + ' row data ' + rowdata}).show();
});

// add move event listener
tableview.addEventListener('move',function(e)
{
	Titanium.API.info("move - row="+e.row+", index="+e.index+", section="+e.section+", from = "+e.fromIndex);
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);

//
//  create edit/cancel buttons for nav bar
//
var edit = Titanium.UI.createButton({
	title:'Move'
});

edit.addEventListener('click', function()
{
	win.setRightNavButton(cancel);
	tableview.moving = true;
});

var cancel = Titanium.UI.createButton({
	title:'Cancel',
	style:Titanium.UI.iPhone.SystemButtonStyle.DONE
});
cancel.addEventListener('click', function()
{
	win.setRightNavButton(edit);
	tableview.moving = false;
});

win.setRightNavButton(edit);