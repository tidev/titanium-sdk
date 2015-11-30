function facebook_test(_args) {
	var self = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor:'#fff'
	});
	var fb = require('facebook');
	//create table view data object
	var data = [
		{title:'Login/Logout', hasChild:true, test:'ui/common/mashups/facebook_login_logout'},
		{title:'Read Stream', hasChild:true, test:'ui/common/mashups/facebook_read_stream'},
		{title:'Publish Stream', hasChild:true, test:'ui/common/mashups/facebook_publish_stream'}
	];
	
	if (Ti.Platform.osname == 'android') {
		data.push({title:'Photos', hasChild:true, test:'ui/common/mashups/facebook_photos'});
	}
	
	// create table view
	for (var i = 0; i < data.length; i++ ) { data[i].color = '#000'; data[i].font = {fontWeight:'bold'}; };
	var tableview = Titanium.UI.createTableView({
		data:data
	});
	
	// create table view event listener
	tableview.addEventListener('click', function(e) {
		if (e.rowData.test) {
			var ExampleWindow = require(e.rowData.test),
				win = new ExampleWindow({title: e.rowData.title});
			_args.containingTab.open(win,{animated:true});
		}
	});
	
	// add table view to the window
	self.add(tableview);
	
	fb.initialize(); // after you set up login/logout listeners and permissions
	
	// ActivityWorker needed for Android
	if (Ti.Platform.osname == 'android') {
		self.fbProxy = fb.createActivityWorker({lifecycleContainer: self});
	}
	
	return self;
};

module.exports = facebook_test;
