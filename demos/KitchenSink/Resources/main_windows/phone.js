// create table view data object
var data = [
	{title:'Play Movie', hasChild:true, test:'../examples/movie.js'},
	{title:'Vibrate', hasChild:true, test:'../examples/vibrate.js'},
	{title:'Geolocation', hasChild:true, test:'../examples/geolocation.js'},
	{title:'Accelerometer', hasChild:true, test:'../examples/accelerometer.js'},
	{title:'Sound', hasChild:true, test:'../examples/sound.js'},
	{title:'Photo Gallery', hasChild:true, test:'../examples/photo_gallery.js'}
];

data.push({title:'Orientation', hasChild:true, test:'../examples/orientation.js'});

if (Titanium.Platform.osname!='ipad')
{
	data.push({title:'Camera', hasChild:true, test:'../examples/camera.js'});
}

// add iphone specific tests
if (Titanium.Platform.name == 'iPhone OS')
{
 //   data.push({title:'Contacts', hasChild:true, test:'../examples/contacts.js'});
	data.push({title:'Screenshot', hasChild:true, test:'../examples/screenshot.js'});
	data.push({title:'Save to Gallery', hasChild:true, test:'../examples/photo_gallery_save.js'});
	data.push({title:'Shake', hasChild:true, test:'../examples/shake.js'});
	if (Titanium.Platform.osname!='ipad')
	{
		data.push({title:'Record Video', hasChild:true, test:'../examples/record_video.js'});
	}
	data.push({title:'iPod', hasChild:true, test:'../examples/ipod.js'});
	data.push({title:'Proximity Events', hasChild:true, test:'../todo.js'});
	data.push({title:'App Badge', hasChild:true, test:'../examples/app_badge.js'});
	data.push({title:'Status Bar', hasChild:true, test:'../examples/statusbar.js'});
	data.push({title:'Push Notifications', hasChild:true, test:'../examples/push_notification.js'});
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
