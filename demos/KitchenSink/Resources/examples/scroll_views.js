// create table view data object
var data = [
	{title:'Basic', hasChild:true, test:'../examples/scroll_views_basic.js'},
	{title:'Scrolling Tabs', hasChild:true, test:'../examples/scroll_views_tabs.js'},
	{title:'Scrollable View', hasChild:true, test:'../examples/scroll_views_scrollable.js'},
	{title:'Scrollable View w/o Clipping', hasChild:true, test:'../examples/scroll_views_without_clipping.js', barColor:'#111', hideNavBar:true,bgImage:'../images/scrollable_view/bg.png'},
	{title:'Many on a Screen', hasChild:true, test:'../examples/scroll_views_many.js'},
	{title:'Scrolling Zoom+Pinch', hasChild:true, test:'../examples/scroll_views_scaling.js'},
	{title:'Scroll Views Dynamic Height', hasChild:true, test:'../examples/scroll_views_dynamic_height.js'},
	{title:'Scroll Views TextArea', hasChild:true, test:'../examples/scroll_views_textareas.js'},

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

		if (e.rowData.barColor)
		{
			win.barColor = e.rowData.barColor;
		}
		if (e.rowData.hideNavBar)
		{
			win.hideNavBar();
		}	
		if (e.rowData.bgImage)
		{
			win.backgroundImage = e.rowData.bgImage;
		}
		Titanium.UI.currentTab.open(win,{animated:true})
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
