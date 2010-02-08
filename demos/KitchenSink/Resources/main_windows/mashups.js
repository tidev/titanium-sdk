// create table view data object
var data = [
{title:'Not Implemented Yet'},

	// {title:'Facebook', hasChild:true, test:'../examples/view_events.js'},
	// {title:'YQL', hasChild:true, test:'../examples/map_view.js'},
	// {title:'Twitter', hasChild:true, test:'../examples/coverflow_view.js'},
	// {title:'SOAP', hasChild:true, test:'../examples/image_views.js'},

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
		Titanium.UI.currentTab.open(win,{animated:true})
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
