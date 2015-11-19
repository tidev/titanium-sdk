function movie(_args) {
	var self = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor:'#fff'
	});
	// create table view data object
	var data = [
		{title:'Local', hasChild:true, test:'ui/common/phone/movie_local'}
	];
	
	Ti.include("/etc/version.js");
	
	
	if (isIPhone3_2_Plus())
	{
		// can only test this support on a 3.2+ device
		data.push({title:'Embedded Video', hasChild:true, test:'ui/handheld/ios/phone/movie_embed'});
	}
	
	data.push({title:'Remote Streaming', hasChild:true, test:'ui/common/phone/movie_remote'});
	
	// add iphone specific tests
	if (Titanium.Platform.name == 'iPhone OS')
	{
		data.push({title:'Remote Streaming 2', hasChild:true, test:'ui/handheld/ios/phone/movie_remote2'});
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
			var ExampleWindow = require(e.rowData.test),
				win = new ExampleWindow({title: e.rowData.title});
			_args.containingTab.open(win,{animated:true});
		}
	});
	
	// add table view to the window
	self.add(tableview);
	return self;
};

module.exports = movie;
