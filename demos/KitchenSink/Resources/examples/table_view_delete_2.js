var win = Titanium.UI.currentWindow;

// create table view data object
var data = [
	{title:'Row 1', hasChild:true},
	{title:'Row 2', hasDetail:true},
	{title:'Row 3'},
	{title:'Row 4'}
	

];

// create table view
var tableview = Titanium.UI.createTableView({
	data:data,
	editable:true
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

// add delete event listener
tableview.addEventListener('delete',function(e)
{
	var s = e.section;
	Ti.API.info('rows ' + s.rows + ' rowCount ' + s.rowCount + ' headerTitle ' + s.headerTitle);

	Titanium.API.info("deleted - row="+e.row+", index="+e.index+", section="+e.section + ' table view row length = ' + tableview.data.length);
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);

//
//  create edit/cancel buttons for nav bar
//
var edit = Titanium.UI.createButton({
	title:'Edit'
});

edit.addEventListener('click', function()
{
	win.setRightNavButton(cancel);
	tableview.editing = true;
});

var cancel = Titanium.UI.createButton({
	title:'Cancel',
	style:Titanium.UI.iPhone.SystemButtonStyle.DONE
});
cancel.addEventListener('click', function()
{
	win.setRightNavButton(edit);
	tableview.editing = false;
});

win.setRightNavButton(edit);