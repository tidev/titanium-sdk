// create table view data object
var data = [
	{title:'Local', hasChild:true, test:'../examples/sound_local.js'},
	{title:'Local with File', hasChild:true, test:'../examples/sound_file.js'},
	{title:'Local with File URL', hasChild:true, test:'../examples/sound_file_url.js'},
	{title:'Remote URL', hasChild:true, test:'../examples/sound_remote_url.js'}
];

if (Titanium.Platform.name == 'iPhone OS')
{
	data.push({title:'Remote Streaming', hasChild:true, test:'../examples/sound_remote.js'});
	data.push({title:'Record', hasChild:true, test:'../examples/sound_record.js'});
}

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
