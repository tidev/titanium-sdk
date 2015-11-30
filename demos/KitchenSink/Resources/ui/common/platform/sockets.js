function sockets(_args) {
	var self = Ti.UI.createWindow({
		title:_args.title
	});
	// create table view data object
	var data = [
		{title:'Connecting socket', hasChild:true, test:'ui/common/platform/socket_connect'},
		{title:'Listening socket', hasChild:true, test:'ui/common/platform/socket_listener'},
		{title:'Server and client example', hasChild:true, test:'ui/common/platform/socket_server_client'}
	];
	
	if (Titanium.Platform.name == 'iPhone OS')
	{
		data.push({title:'iOS TCP Sockets [deprecated]', hasChild:true, test:'ui/handheld/ios/platform/ios_sockets'});
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
			var ExampleWindow = require(e.rowData.test),
				win = new ExampleWindow({title: e.rowData.title});
			_args.containingTab.open(win,{animated:true});
		}
	});
	
	// add table view to the window
	self.add(tableview);
	
	return self;
};

module.exports = sockets;
