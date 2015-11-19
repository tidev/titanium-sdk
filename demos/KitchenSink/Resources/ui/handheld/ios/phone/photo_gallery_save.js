function gallery_save(_args) {
	var self = Ti.UI.createWindow({
		title:_args.title
	});
	// create table view data object
	var data = [
		{title:'From File', hasChild:true, test:'ui/handheld/ios/phone/photo_gallery_file'},
		{title:'From XHR', hasChild:true, test:'ui/handheld/ios/phone/photo_gallery_xhr'},
		{title:'Background Image', hasChild:true, test:'ui/handheld/ios/phone/photo_gallery_bgimage'}
	];
	
	if (Titanium.Platform.osname!='ipad')
	{
		data.push({title:'From Camera', hasChild:true, test:'ui/handheld/ios/phone/photo_gallery_camera'});
		data.push({title:'From Video', hasChild:true, test:'ui/handheld/ios/phone/photo_gallery_video'});
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
			var ExampleWindow = require(e.rowData.test),
				win = new ExampleWindow({title: e.rowData.title});
			_args.containingTab.open(win,{animated:true});
		}
	});
	
	// add table view to the window
	self.add(tableview);
	return self;
};

module.exports = gallery_save;
