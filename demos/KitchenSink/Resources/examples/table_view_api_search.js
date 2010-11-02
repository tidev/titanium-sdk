var win = Titanium.UI.currentWindow;

// create table view data object
var data = [];

data[0] = Ti.UI.createTableViewRow({hasChild:true,title:'Row 1'});
data[1] = Ti.UI.createTableViewRow({hasDetail:true,title:'Row 2'});
data[2] = Ti.UI.createTableViewRow({hasCheck:true,title:'Row 3'});
data[3] = Ti.UI.createTableViewRow({title:'Row 4'});

var search = Titanium.UI.createSearchBar({
	barColor:'#385292', 
	showCancel:false,
	hintText:'search'
});
search.addEventListener('change', function(e)
{
   e.value // search string as user types
});
search.addEventListener('return', function(e)
{
   search.blur();
});
search.addEventListener('cancel', function(e)
{
   search.blur();
});

// create table view
var tableview = Titanium.UI.createTableView({
	data:data,
	search:search,
	searchHidden:true
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

var hide = Titanium.UI.createButtonBar({
	labels:['Hide', 'Show'],
	backgroundColor:'#336699',
	height:25,
	width:120
});


// add table view to the window
win.add(tableview);

hide.addEventListener('click', function(e)
{
	Ti.API.info("search hidden = "+tableview.searchHidden);
	if (e.index == 0)
	{
		tableview.searchHidden = true;
	}
	else if (e.index == 1)
	{
		tableview.scrollToTop(0,{animated:true});
	}
});
if (Titanium.Platform.name == 'iPhone OS') {
	win.setRightNavButton(hide);
}
