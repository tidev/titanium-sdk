Ti.include('../common.js');

// create table view data object
var data = [
	{title:'Play Movie', test:'../examples/movie_local.js'},
	//{title:'Vibrate', test:'../examples/vibrate.js'},
	{title:'Sound', test:'../examples/sound.js'},
	{title:'Photo Gallery', test:'../examples/photo_gallery.js'},
	{title:'Orientation', test:'../examples/orientation.js'},
	//{title:'Contacts', test:'../examples/contacts.js'},
	{title:'Notfications', test:'../examples/notification.js'}
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
