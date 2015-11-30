function ipad_feature(_args) {
	var win = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor:'#fff'
	});
	
	var useNavWindow = (Ti.version >= '3.2.0');
	
	//create table view data object
	var data = [
		{title:'SplitView with Navigation', hasChild:true, test:'ui/tablet/ios/baseui/split_view_nav'},
		{title:'SplitView Plain', hasChild:true, test:'ui/tablet/ios/baseui/split_view_plain'},
		{title:'Navigation Controller', hasChild:true, test:'ui/tablet/ios/baseui/nav_controller'},
		{title:'Main Tests', hasChild:true, test:'ui/tablet/ios/baseui/main_tests'},
		{title:'SplitView Features', hasChild:true, test:'ui/tablet/ios/baseui/split_view_features'},
	];
	
	if (useNavWindow == false) {
		data.push({title:'BUG-3298', hasChild:true, test:'ui/tablet/ios/baseui/3298'});
	}
	
	// create table view
	for (var i = 0; i < data.length; i++ ) { data[i].color = '#000'; data[i].font = {fontWeight:'bold'}; };
	var tableview = Titanium.UI.createTableView({
		data:data
	});
	
	// create table view event listener
	tableview.addEventListener('click', function(e)
	{
		if (e.rowData.test)
		{
			Ti.API.info('Test being opened is ::'+e.rowData.test);
			var ExampleWindow = require(e.rowData.test);
			if (ExampleWindow == undefined) {
				Ti.API.info('FAILURE REQURE!');
			};	
			win = new ExampleWindow({title: e.rowData.title});

			Ti.API.info('Going to open :: '+win);
			win.open();
		}
	});
	
	// add table view to the window
	win.add(tableview);
	return win;
};

module.exports = ipad_feature;