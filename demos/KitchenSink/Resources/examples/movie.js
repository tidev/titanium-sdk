// create table view data object
var data = [
	{title:'Local', hasChild:true, test:'../examples/movie_local.js'}
];

Ti.include("version.js");


if (isIPhone3_2_Plus())
{
	// can only test this support on a 3.2+ device
	data.push({title:'Embedded Video', hasChild:true, test:'../examples/movie_embed.js'});
}

data.push({title:'Remote Streaming', hasChild:true, test:'../examples/movie_remote.js'});

// add iphone specific tests
if (Titanium.Platform.name == 'iPhone OS')
{
	data.push({title:'Remote Streaming 2', hasChild:true, test:'../examples/movie_remote2.js'});
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
