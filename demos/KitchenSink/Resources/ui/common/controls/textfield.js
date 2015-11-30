function textfield_list(_args) {
	var self = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor:'white'
	});
	
	// create table view data object
	var data = [
		{title:'Events', hasChild:true, test:'ui/common/controls/textfield_events'},
		{title:'The Rest', hasChild:true, test:'ui/common/controls/textfield_therest'}
	];
	
	if (Ti.Platform.osname !== 'mobileweb') {
		data.push({title:'Keyboard', hasChild:true, test:'ui/common/controls/textfield_keyboards'});
		data.push({title:'Border Style', hasChild:true, test:'ui/common/controls/textfield_borders'});
	}
	
	// add iphone specific tests
	if (Titanium.Platform.name == 'iPhone OS')
	{
		data.push({title:'Toolbar', hasChild:true, test:'ui/handheld/ios/controls/textfield_toolbar'});
		data.push({title:'Buttons on Textfields', hasChild:true, test:'ui/handheld/ios/controls/textfield_buttons'});
		data.push({title:'Textfield in scrollview', hasChild:true, test:'ui/handheld/ios/controls/textfield_scrollview'});
	} else if (Titanium.Platform.name == 'android') {
		data.push({title:'Soft Input Focus', hasChild:true, test:'ui/handheld/android/controls/textfield_softinputfocus'});
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

module.exports = textfield_list;
