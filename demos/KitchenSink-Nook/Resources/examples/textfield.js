Ti.include('../common.js');

// create table view data object
var data = [
	{title:'Events', test:'../examples/textfield_events.js'},
	{title:'Keyboard', test:'../examples/textfield_keyboards.js'},
	//{title:'Border Style', test:'../examples/textfield_borders.js'},
	{title:'The Rest', test:'../examples/textfield_therest.js'}
];
NookKS.formatTableView(data);

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
