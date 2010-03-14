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
// set filters
tableview.index = [
	{title:'A',index:0},
	{title:'B',index:5},
	{title:'C',index:9},
	{title:'D',index:13},
	{title:'E',index:19},
	{title:'F',index:23},
	{title:'G',index:27},
	{title:'H',index:30},
	{title:'I',index:33},
	{title:'J',index:36},
	{title:'K',index:41},
	{title:'L',index:44},
	{title:'M',index:48},
	{title:'N',index:52},
	{title:'O',index:55},
	{title:'P',index:(data.length -1)},
	
];

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
