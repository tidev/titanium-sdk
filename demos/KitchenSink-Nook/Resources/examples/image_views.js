Ti.include('../common.js');

var data = [
	{title:'Basic', hasChild:true, test:'../examples/image_view_basic.js'},
	{title:'Animated', hasChild:true, test:'../examples/image_view_animated.js'},
	{title:'Image File', hasChild:true, test:'../examples/image_view_file.js'},
	{title:'Remote Image', hasChild:true, test:'../examples/image_view_remote.js'},
	{title:'Image Scaling', hasChild:true, test:'../examples/image_view_scaling.js'},
	{title:'Image View Positioning', hasChild:true, test:'../examples/image_view_positioning.js'},
	{title:'Image View Encoding', hasChild:true, test:'../examples/image_view_encoding.js'},
	{title:'Image Rapid Update', hasChild:true, test:'../examples/image_view_updateimages.js'},
	{title:'Android drawable resource', hasChild:true, test:'image_view_resource.js'}	
];

Titanium.UI.currentWindow.add(NookKS.createNavigationTableView(data));

