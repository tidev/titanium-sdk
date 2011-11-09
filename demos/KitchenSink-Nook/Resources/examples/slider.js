Ti.include('../common.js');

// create slider view data object
var data = [
	{title:'Basic', test:'../examples/slider_basic.js'},
	{title:'Change Min/Max', test:'../examples/slider_min_max.js'},
	{title:'Min/Max Range', test:'../examples/slider_range.js'}
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
