var data = [
	{title:'Music picker', hasChild:true, test:'music_picker.js'},
	{title:'Music player', hasChild:true, test:'music_player.js'},
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