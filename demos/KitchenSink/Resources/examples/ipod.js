var data = [
	{title:'iPod picker', hasChild:true, test:'ipod_picker.js'}
];

var tableView = Titanium.UI.createTableView({
	data:data
});

// create table view event listener
tableView.addEventListener('click', function(e)
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
Titanium.UI.currentWindow.add(tableView);