	//
	//	animation properties
	//	---------------------
	//	zIndex, left, right, top, bottom, width, height
	//	duration, center, backgroundColor, opacity, opaque,
	//	visible, curve, repeat, autoreverse, delay, transform, transition
	//
function anim(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title
	});
	// create table view data object
	var data = [
		{title:'Basic', hasChild:true, test:'ui/handheld/ios/baseui/basic_animation'},
		{title:'Transitions', hasChild:true, test:'ui/handheld/ios/baseui/transitions'},
		{title:'Windows', hasChild:true, test:'ui/handheld/ios/baseui/window_animation'},
		{title:'Views', hasChild:true, test:'ui/handheld/ios/baseui/view_animation'},
		{title:'Controls', hasChild:true, test:'ui/handheld/ios/baseui/control_animation'},
		{title:'2D Transform', hasChild:true, test:'ui/handheld/ios/baseui/2d_transform'},
		{title:'3D Transform', hasChild:true, test:'ui/handheld/ios/baseui/3d_transform'},
		{title:'Anchor Point', hasChild:true, test:'ui/handheld/ios/baseui/anchor_point'},
		{title:'Image Scaling', hasChild:true, test:'ui/handheld/ios/baseui/image_scaling'},
		{title:'Animation Points', hasChild:true, test:'ui/handheld/ios/baseui/animation_points'}
	
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

module.exports = anim;