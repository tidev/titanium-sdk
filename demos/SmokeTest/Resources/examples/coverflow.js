// create table view data object
var data = [
	{title:'Coverflow Local Files', hasChild:true, test:'../examples/coverflow_view.js'},
	{title:'Coverflow Remote Files', hasChild:true, test:'../examples/coverflow_remote.js'},
	{title:'Coverflow Replace Images', hasChild:true, test:'../examples/coverflow_replace.js'}
];

// create table view
var tableview = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableview.addEventListener('click', function(e)
{
	if (e.rowData.test)
	{
		var win = Titanium.UI.createWindow({
			url:e.rowData.test,
			title:e.rowData.title
		});
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
