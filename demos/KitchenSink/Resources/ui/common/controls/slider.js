function slider(_args) {
	var self = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor:'white'
	});
	
	var data = [
		{title:'Basic', hasChild:true, test:'ui/common/controls/slider_basic'},
		{title:'Change Min/Max', hasChild:true, test:'ui/common/controls/slider_min_max'}
	];
	
	if (Titanium.Platform.name == 'android') {
		data.push({title:'Min/Max Range', hasChild:true, test:'ui/handheld/android/controls/slider_range'});
	}
	
	if (Titanium.Platform.osname === 'tizen') {
		data.push({ title: 'Min/Max Range', hasChild: true, test: 'ui/handheld/tizen/controls/slider_range' });
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

module.exports = slider;
