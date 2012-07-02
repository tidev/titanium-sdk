// create table view data object
var data = [
	{title:'Camera Basic', hasChild:true, test:'../examples/camera_basic.js'},
	{title:'Camera Custom Overlay', hasChild:true, test:'../examples/camera_overlay.js'},
	{title:'Camera Overlay Webview', hasChild:true, test:'../examples/camera_overlay_webview.js'},
	{title:'Save to Gallery (Auto)', hasChild:true, test:'../examples/camera_gallery.js'},
	{title:'Save to File', hasChild:true, test:'../examples/camera_file.js'}
];

if (Ti.Platform.osname == "iphone") {
	data.push({title:'Camera Augmented Reality', hasChild:true, test:'../examples/camera_ar.js'});

	Ti.include('version.js');
	
	if (isiOS4Plus())
	{
		data.push({title:'Video Record', hasChild:true, test:'../examples/camera_video.js'});	
		
		//TODO: this seems to work the first time, but not subsequent. fix for 1.5
		//data.push({title:'Video Editing', hasChild:true, test:'../examples/video_edit.js'});	
	}
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
		var win = Titanium.UI.createWindow({
			url:e.rowData.test,
			title:e.rowData.title
		});
		Titanium.UI.currentTab.open(win,{animated:true});
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);

