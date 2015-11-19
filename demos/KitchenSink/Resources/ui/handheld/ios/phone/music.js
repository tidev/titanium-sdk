function music(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	// create slider view data object
	var data = [
		{title:'Music picker', hasChild:true, test:'ui/handheld/ios/phone/music_picker'},
		{title:'Music query', hasChild:true, test:'ui/handheld/ios/phone/music_query'}
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
			var ExampleWindow = require(e.rowData.test),
				win = new ExampleWindow({title: e.rowData.title});
			_args.containingTab.open(win,{animated:true});
		}
	});
	
	// add table view to the window
	win.add(tableview);
	return win;
};

module.exports = music;