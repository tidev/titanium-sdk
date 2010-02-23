// create table view data object
var data = [
	{title:'Camera Basic', hasChild:true, test:'../examples/camera_basic.js'},
	{title:'Camera Custom Overlay', hasChild:true, test:'../examples/camera_overlay.js'},
	{title:'Camera Overlay Webview', hasChild:true, test:'../examples/camera_overlay_webview.js'},
	{title:'Camera Augmented Reality', hasChild:true, test:'../examples/camera_ar.js'},
	{title:'Save to Gallery (Auto)', hasChild:true, test:'../examples/camera_gallery.js'},
	{title:'Save to File', hasChild:true, test:'../examples/camera_file.js'},

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
			title:e.rowData.title
		});
		Titanium.UI.currentTab.open(win,{animated:true})
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);

