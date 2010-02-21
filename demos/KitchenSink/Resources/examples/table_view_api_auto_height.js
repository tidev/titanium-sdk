// create table view data object
var data = [];

data[0] = Ti.UI.createTableViewRow({hasChild:true,height:'auto'});
data[1] = Ti.UI.createTableViewRow({hasDetail:true,height:'auto'});
data[2] = Ti.UI.createTableViewRow({hasCheck:true,height:'auto'});

function addRow(idx,text)
{
	data[idx].add(Ti.UI.createLabel({
		text:text,
		height:'auto',
		width:'auto',
		left:10,
		right:50,
		top:10,
		bottom:10
	}));
}

addRow(0,'This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.');
addRow(1,'This is some long text.  This is some long text.  This is some long text.  This is some long text.');
addRow(2,'This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.  This is some long text.');


// create table view
var tableview = Titanium.UI.createTableView({
	data:data,
	minRowHeight:80
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

