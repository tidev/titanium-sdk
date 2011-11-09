Ti.include('../common.js');

//create table view data object
var data = [
	{title:'Events Propagation', test:'../examples/view_event_propagation.js'},
	{title:'Events Interaction', test:'../examples/view_event_interaction.js'},
	{title:'Image Views', test:'../examples/image_views.js'},
	{title:'Scroll Views', test:'../examples/scroll_views.js'},
	{title:'Table Views', test:'../examples/table_views.js'},
	{title:'Web Views', test:'../examples/web_views.js'},
	{title:'Alert Dialog', test:'../examples/alert.js'},
	{title:'Options Dialog', test:'../examples/options_dialog.js'},
	{title:'Remove Views', test:'../examples/remove_views.js'},
	{title:'zIndex', test:'../examples/views_zindex.js'},
	{title:'Email Dialog', test:'../examples/email_dialog.js'},
	//{title:'Map View', test:'../examples/map_view.js'},
	{title:'View w/ Size', test:'../examples/view_with_size.js'}
];

Titanium.UI.currentWindow.add(NookKS.createNavigationTableView(data));