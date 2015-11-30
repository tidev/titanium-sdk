function gallery_save(_args) {
	var self = Ti.UI.createWindow();
	// create table view data object
	var data = [
	    {title:'From File', hasChild:true, test:'ui/handheld/tizen/phone/photo_gallery_file'},
		{title:'From XHR', hasChild:true, test:'ui/handheld/tizen/phone/photo_gallery_xhr'},
		{title:'Background Image', hasChild:true, test:'ui/handheld/tizen/phone/photo_gallery_bgimage'}
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
				win = new ExampleWindow();
			_args.containingTab.open(win,{animated:true});
		}
	});
	
	// add table view to the window
	self.add(tableview);
	return self;
};

module.exports = gallery_save;
