// create table view data object
var data = [
	{title:'Alan', hasChild:true, header:'A'},
	{title:'Alice', hasDetail:true},
	{title:'Alexander'},
	{title:'Amos'},
	{title:'Alonzo'},
	{title:'Brad', header:'B'},
	{title:'Brent'},
	{title:'Billy'},
	{title:'Brenda'},
	{title:'Callie', header:'C'},
	{title:'Cassie'},
	{title:'Chris'},
	{title:'Cameron'},
	{title:'Don', header:'D'},
	{title:'Dilbert'},
	{title:'Deacon'},
	{title:'Devin'},
	{title:'Darin'},
	{title:'Darcy'},
	{title:'Erin', header:'E'},
	{title:'Erica'},
	{title:'Elvin'},
	{title:'Edrick'},
	{title:'Frank', header:'F'},
	{title:'Fred'},
	{title:'Fran'},
	{title:'Felicity'},
	{title:'George', header:'G'},
	{title:'Gina'},
	{title:'Gary'},
	{title:'Herbert', header:'H'},
	{title:'Henry'},
	{title:'Harold'},
	{title:'Ignatius', header:'I'},
	{title:'Irving'},
	{title:'Ivan'},
	{title:'Dr. J', header:'J'},
	{title:'Jefferson'},
	{title:'Jenkins'},
	{title:'Judy'},
	{title:'Julie'},
	{title:'Kristy', header:'K'},
	{title:'Krusty the Clown'},
	{title:'Klaus'},
	{title:'Larry', header:'L'},
	{title:'Leon'},
	{title:'Lucy'},
	{title:'Ludwig'},
	{title:'Mary', header:'M'},
	{title:'Mervin'},
	{title:'Malcom'},
	{title:'Mellon'},
	{title:'Ned', header:'N'},
	{title:'Nervous Eddie'},
	{title:'Nelson'},
	{title:'The Big O', header:'O'},
	{title:'Orlando'},
	{title:'Ox'},
	{title:'Pluto', header:'P'},
	{title:'Paris'},
	{title:'Potsie'}
];

var search = Titanium.UI.createSearchBar({
	showCancel:false
});
// create table view
var tableview = Titanium.UI.createTableView({
	data:data,
	search:search,
	filterAttribute:'title'
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	// event data
	var index = e.index;
	var section = e.section;
	var row = e.row;
	var rowdata = e.rowData;
	
	e.section.headerTitle = e.section.headerTitle + ' section has been clicked';
	Titanium.UI.createAlertDialog({title:'Table View',message:'row ' + row + ' index ' + index + ' section ' + section  + ' row data ' + rowdata}).show();
});
// add table view to the window
Titanium.UI.currentWindow.add(tableview);
