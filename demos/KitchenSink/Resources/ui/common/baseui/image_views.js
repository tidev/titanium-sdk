function image_views(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor:'#fff'
	});
	// create table view data object
	var data = [
		{title:'Basic', hasChild:true, test:'ui/common/baseui/image_view_basic'},
		{title:'Image File', hasChild:true, test:'ui/common/baseui/image_view_file'},
		{title:'Remote Image', hasChild:true, test:'ui/common/baseui/image_view_remote'},
		{title:'Image Scaling', hasChild:true, test:'ui/common/baseui/image_view_scaling'},
		{title:'Image View Positioning', hasChild:true, test:'ui/common/baseui/image_view_positioning'}
	];
	
	if (Ti.Platform.osname !== 'mobileweb') {
		data.push({title:'Animated', hasChild:true, test:'ui/common/baseui/image_view_animated'});
		data.push({title:'Image View Encoding', hasChild:true, test:'ui/common/baseui/image_view_encoding'});
	}
	
	// add iphone specific tests
	if (Titanium.Platform.name == 'iPhone OS')
	{
		data.push({title:'Image Blob', hasChild:true, test:'ui/handheld/ios/baseui/image_view_blob'});
		data.push({title:'Image Masking', hasChild:true, test:'ui/handheld/ios/baseui/image_mask'});
		data.push({title:'Image Toolbar', hasChild:true, test:'ui/handheld/ios/baseui/image_view_toolbar'});
	}
	
	data.push({title:'Image Rapid Update', hasChild:true, test:'ui/common/baseui/image_view_updateimages'});
	if (Titanium.Platform.name == 'android') {
		data.push({title:'Android drawable resource', hasChild:true, test:'ui/handheld/android/baseui/image_view_resource'});
	}
	
	// create table view
	for (var i = 0; i < data.length; i++ ) { data[i].color = '#000'; data[i].font = {fontWeight:'bold'} };
	var tableview = Titanium.UI.createTableView({
		data:data
	});
	
	// create table view event listener
	tableview.addEventListener('click', function(e)
	{
		if (e.rowData.test)
		{
			var ExampleWindow = require(e.rowData.test);
			win = new ExampleWindow({title: e.rowData.title, containingTab: _args.containingTab, tabGroup: _args.tabGroup});
			_args.containingTab.open(win,{animated:true});
		}
	});
	
	// add table view to the window
	win.add(tableview);
	return win;
};

module.exports = image_views;