function camera(_args) {
	var self = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor:'#fff'
	});
	// create table view data object
	var data = [
		{title:'Camera Basic', hasChild:true, test:'ui/common/phone/camera_basic'}
	];
	
	if (Ti.Platform.osname == "iphone" ||Ti.Platform.osname == 'ipad') {
		data.push({title:'Camera Custom Overlay', hasChild:true, test:'ui/handheld/ios/phone/camera_overlay'});
		data.push({title:'Camera Overlay Webview', hasChild:true, test:'ui/handheld/ios/phone/camera_overlay_webview'});
		data.push({title:'Camera Augmented Reality', hasChild:true, test:'ui/handheld/ios/phone/camera_ar'});
		data.push({title:'Save to Gallery (Auto)', hasChild:true, test:'ui/handheld/ios/phone/camera_gallery'});
		data.push({title:'Save to File', hasChild:true, test:'ui/handheld/ios/phone/camera_file'});	
	
		Ti.include('/etc/version.js');
		
		if (isiOS4Plus())
		{
			data.push({title:'Video Record', hasChild:true, test:'ui/handheld/ios/phone/camera_video'});	
			
			//TODO: this seems to work the first time, but not subsequent. fix for 1.5
			//data.push({title:'Video Editing', hasChild:true, test:'ui/common/phone/video_edit'});	
		}
	}
	if(Ti.Platform.osname == 'ipad') {
		data.push({title:'Camera Popover view', hasChild:true, test:'ui/tablet/ios/baseui/camera_popover'});
	}
	
	// create table view
	for (var i = 0; i < data.length; i++ ) { data[i].color = '#000'; data[i].font = {fontWeight:'bold'}; };
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

module.exports = camera;

