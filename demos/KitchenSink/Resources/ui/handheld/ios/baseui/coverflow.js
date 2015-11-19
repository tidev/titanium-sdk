function coverflow(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	// create table view data object
	var data = [
		{title:'Coverflow Local Files', hasChild:true, test:'ui/handheld/ios/baseui/coverflow_view'},
		{title:'Coverflow Remote Files', hasChild:true, test:'ui/handheld/ios/baseui/coverflow_remote'},
		{title:'Coverflow Replace Images', hasChild:true, test:'ui/handheld/ios/baseui/coverflow_replace'}
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
			var ExampleWindow = require(e.rowData.test);
			win = new ExampleWindow({title: e.rowData.title});
			_args.containingTab.open(win,{animated:true});
		}
	});
	
	// add table view to the window
	win.add(tableview);
	return win;
};

module.exports = coverflow;