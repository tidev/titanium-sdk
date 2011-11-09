Ti.include('../common.js');

// create table view data object
var data = [
	{title:'Basic', hasChild:true, test:'../examples/scroll_views_basic.js'},
	{title:'Scrolling Tabs', hasChild:true, test:'../examples/scroll_views_tabs.js'},
	{title:'Scrollable View', hasChild:true, test:'../examples/scroll_views_scrollable.js'},
	{title:'Many on a Screen', hasChild:true, test:'../examples/scroll_views_many.js'},
	{title:'Scroll Views TextArea', hasChild:true, test:'../examples/scroll_views_textareas.js'}
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

		if (e.rowData.barColor)
		{
			win.barColor = e.rowData.barColor;
		}
		if (e.rowData.bgImage)
		{
			win.backgroundImage = e.rowData.bgImage;
		}
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
