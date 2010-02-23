// create table view data object
var data = [
	{title:'Play Movie', hasChild:true, test:'../examples/movie.js'},
	{title:'Record Video', hasChild:true, test:'../examples/record_video.js'},
	{title:'Screenshot', hasChild:true, test:'../examples/screenshot.js'},
	{title:'Camera', hasChild:true, test:'../examples/camera.js'},
	{title:'Vibrate', hasChild:true, test:'../examples/vibrate.js'},
	{title:'Orientation', hasChild:true, test:'../examples/orientation.js'},
	{title:'Photo Gallery', hasChild:true, test:'../examples/photo_gallery.js'},
	{title:'Geolocation', hasChild:true, test:'../examples/geolocation.js'},
	{title:'Accelerometer', hasChild:true, test:'../examples/accelerometer.js'},
	{title:'Sound', hasChild:true, test:'../examples/sound.js'},
	{title:'Shake', hasChild:true, test:'../examples/shake.js'},
	{title:'Save to Gallery', hasChild:true, test:'../examples/photo_gallery_save.js'},
//	{title:'Contacts', hasChild:true, test:'../examples/contacts.js'},
	{title:'Contacts', hasChild:true, test:'../todo.js'},
	{title:'Proximity Events', hasChild:true, test:'../todo.js'},
];

// add iphone specific tests
if (Titanium.Platform.name == 'iPhone OS')
{
	data.push({title:'App Badge', hasChild:true, test:'../examples/app_badge.js'});
	data.push({title:'Status Bar', hasChild:true, test:'../examples/statusbar.js'});
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
		Titanium.UI.currentTab.open(win,{animated:true})
	}
});

// add table view to the window
Titanium.UI.currentWindow.add(tableview);