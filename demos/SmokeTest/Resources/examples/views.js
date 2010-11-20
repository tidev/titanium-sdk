//create table view data object
var data = [
	//{title:'Events Propagation', hasChild:true, test:'../examples/view_event_propagation.js'},
	{title:'Events Interaction', hasChild:true, test:'../examples/view_event_interaction.js'},
	{title:'Image Views', hasChild:true, test:'../examples/image_views.js'},
	{title:'Scroll Views', hasChild:true, test:'../examples/scroll_views.js'},
	{title:'Table Views', hasChild:true, test:'../examples/table_views.js'},
	{title:'Web Views', hasChild:true, test:'../examples/web_views.js'},
	{title:'Alert Dialog', hasChild:true, test:'../examples/alert.js'},
	{title:'Options Dialog', hasChild:true, test:'../examples/options_dialog.js'},
	//{title:'Remove Views', hasChild:true, test:'../examples/remove_views.js'},
	{title:'zIndex', hasChild:true, test:'../examples/views_zindex.js'},
    //{title:'Email Dialog', hasChild:true, test:'../examples/email_dialog.js'},
	{title:'Map View', hasChild:true, test:'../examples/map_view.js'},
	//{title:'View w/ Size', hasChild:true, test:'../examples/view_with_size.js'},

];

if (Titanium.Platform.name == 'iPhone OS')
{
	/*
	data.push({title:'Map View with Routing', hasChild:true, test:'../examples/map_view2.js'});
	data.push({title:'Events', hasChild:true, test:'../examples/view_events.js'});
	data.push({title:'Events with Views', hasChild:true, test:'../examples/view_events_2.js'});
	data.push({title:'Coverflow View', hasChild:true, test:'../examples/coverflow.js'});
	data.push({title:'Dashboard View', hasChild:true, test:'../examples/dashboard.js'});
	data.push({title:'Auto Height', hasChild:true, test:'../examples/views_auto_height.js'});
	data.push({title:'Min Height', hasChild:true, test:'../examples/views_min_height.js'});
	data.push({title:'Mixing Views', hasChild:true, test:'../examples/mixing_views_1.js'});
//	data.push({title:'Web View Repaint', hasChild:true, test:'../examples/webview_repaint.js'});
	data.push({title:'Gradient', hasChild:true, test:'../examples/gradient.js'});
	data.push({title:'Hide/Show', hasChild:true, test:'../examples/view_hide_show.js'});
	*/
	
	Ti.include("version.js");

	if (isiOS4Plus())
	{
		data.push({title:'Hi-Res Image', wintitle:"Fence", hasChild:true, test:'../examples/hi_res_image.js'});
		//data.push({title:'Hi-Res Image 2', wintitle:"Dog", hasChild:true, test:'../examples/hi_res_image2.js'});
	}
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
			title:e.rowData.wintitle || e.rowData.title
		});
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
