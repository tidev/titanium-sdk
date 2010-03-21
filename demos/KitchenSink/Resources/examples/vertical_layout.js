//create table view data object
var data = [
	{title:'Basic', hasChild:true, test:'../examples/vertical_layout_basic.js'},
	 {title:'Table View', hasChild:true, test:'../examples/vertical_layout_table_view.js'}
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



