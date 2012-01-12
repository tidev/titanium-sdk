// create table view data object
var data = [
	{title:'Row 1', hasChild:true, color:'red', selectedColor:'#fff'},
	{title:'Row 2', hasDetail:true, color:'green', selectedColor:'#fff'},
	{title:'Row 3', hasCheck:true, color:'blue', selectedColor:'#fff'},
	{title:'Row 4', color:'orange', selectedColor:'#fff'}
	

];

// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

function showClickEventInfo(e, islongclick) {
	// event data
	var index = e.index;
	var section = e.section;
	var row = e.row;
	var rowdata = e.rowData;
	Ti.API.info('detail ' + e.detail);
	var msg = 'row ' + row + ' index ' + index + ' section ' + section  + ' row data ' + rowdata;
	if (islongclick) {
		msg = "LONGCLICK " + msg;
	}
	Titanium.UI.createAlertDialog({title:'Table View',message:msg}).show();
}

// create table view event listener
tableview.addEventListener('click', function(e)
{
	showClickEventInfo(e);
});
tableview.addEventListener('longclick', function(e)
{
	showClickEventInfo(e, true);
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
