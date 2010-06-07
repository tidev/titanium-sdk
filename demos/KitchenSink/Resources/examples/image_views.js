// create table view data object
var data = [
	{title:'Basic', hasChild:true, test:'../examples/image_view_basic.js'},
	{title:'Animated', hasChild:true, test:'../examples/image_view_animated.js'},
	{title:'Image File', hasChild:true, test:'../examples/image_view_file.js'},
	{title:'Remote Image', hasChild:true, test:'../examples/image_view_remote.js'},
	{title:'Image Scaling', hasChild:true, test:'../examples/image_view_scaling.js'},
	{title:'Image View Positioning', hasChild:true, test:'../examples/image_view_positioning.js'}

];

// add iphone specific tests
if (Titanium.Platform.name == 'iPhone OS')
{
	data.push({title:'Image Blob', hasChild:true, test:'../examples/image_view_blob.js'});
	data.push({title:'Image Masking', hasChild:true, test:'../examples/image_mask.js'});
	data.push({title:'Image Toolbar', hasChild:true, test:'../examples/image_view_toolbar.js'});
}

data.push({title:'Image Rapid Update', hasChild:true, test:'../examples/image_view_updateimages.js'});

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
			title:e.rowData.title
		});
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);
