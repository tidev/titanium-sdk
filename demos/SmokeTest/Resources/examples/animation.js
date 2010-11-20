//
// 	animation properties
//	---------------------
//	zIndex, left, right, top, bottom, width, height
//	duration, center, backgroundColor, opacity, opaque,
//	visible, curve, repeat, autoreverse, delay, transform, transition
//

// create table view data object
var data = [
	{title:'Basic', hasChild:true, test:'../examples/basic_animation.js'},
	{title:'Transitions', hasChild:true, test:'../examples/transitions.js'},
	{title:'Windows', hasChild:true, test:'../examples/window_animation.js'},
	{title:'Views', hasChild:true, test:'../examples/view_animation.js'},
	{title:'Controls', hasChild:true, test:'../examples/control_animation.js'},
	{title:'2D Transform', hasChild:true, test:'../examples/2d_transform.js'},
	{title:'3D Transform', hasChild:true, test:'../examples/3d_transform.js'},
	{title:'Anchor Point', hasChild:true, test:'../examples/anchor_point.js'},
	{title:'Image Scaling', hasChild:true, test:'../examples/image_scaling.js'},
	{title:'Animation Points', hasChild:true, test:'../examples/animation_points.js'}

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
			title:e.rowData.title,
			backgroundColor:'#fff'
		});
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);