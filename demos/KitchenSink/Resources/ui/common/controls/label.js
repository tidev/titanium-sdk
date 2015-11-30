function label(_args) {
	var self = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor:'white'
	});
	
	// create label view data object
	var data = [
		{title:'Basic', hasChild:true, test:'ui/common/controls/label_basic'}
	];
	
	// add android specific tests
	if (Titanium.Platform.name == 'android')
	{
		data.push({title:'Auto Link', hasChild:true, test:'ui/handheld/android/controls/label_linkify'});
	} else if (Titanium.Platform.osname === 'tizen') {
		data.push({ title: 'Auto Link', hasChild: true, test: 'ui/common/controls/label_linkify' });
	}
	
	// create table view
	for (var i = 0; i < data.length; i++ ) { data[i].color = '#000'; data[i].font = {fontWeight:'bold'} };
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
	return self;
}

module.exports = label;
