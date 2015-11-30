function PlatformWindow(title) {
	var self = Ti.UI.createWindow({
		title:title,
		backgroundColor:'white'
	});

	var isMobileWeb = Titanium.Platform.osname === 'mobileweb',
		isTizen = Titanium.Platform.osname === 'tizen';

	// Create table view data object.
	var data = [
		{title:'XHR', hasChild:true, test:'ui/common/platform/xhr'},
		{title:'Network', hasChild: !isTizen, test:'ui/common/platform/network', touchEnabled: !isTizen},
		{title:'Common JS', hasChild:true, test:'ui/common/platform/commonjs'},
		{title:'Logging', hasChild:true, test:'ui/common/platform/logging'},
		{title:'Application Data', hasChild: !isMobileWeb, test:'ui/common/platform/app_data', touchEnabled: !isMobileWeb, color:isMobileWeb?"#aaa":"#000"},
		{title:'Application Events', hasChild: !(isMobileWeb || isTizen), test:'ui/common/platform/app_events', touchEnabled: !(isMobileWeb || isTizen), color: isMobileWeb?"#aaa":"#000"},
		{title:'Properties API', hasChild:true, test:'ui/common/platform/properties'},
		{title:'Database', hasChild: !(isMobileWeb || isTizen), test:'ui/common/platform/database', touchEnabled: !(isMobileWeb || isTizen), color:isMobileWeb?"#aaa":"#000"},
		{title:'Platform Data', hasChild:true, test:'ui/common/platform/platform'},
		{title:'Filesystem', hasChild:true, test:'ui/common/platform/filesystem'},
		{title:'JS Includes', hasChild:true, test:'ui/common/platform/js_include'},
		{title:'Set Timeout (timer)', hasChild:true, test:'ui/common/platform/set_timeout'},
		{title:'Set Interval (timer)', hasChild:true, test:'ui/common/platform/set_interval'},
		{title:'XML RSS', hasChild:!isMobileWeb, test:'ui/common/platform/xml_rss', touchEnabled:!isMobileWeb, color:isMobileWeb?"#aaa":"#000"},
		{title:'Utils', hasChild:true, test:'ui/common/platform/utils'},
		{title:'JSON', hasChild:true, test:'ui/common/platform/json'},
		{title:'JS search', hasChild:true, test:'ui/common/platform/search_case_insensitive'},
		{title:'Clipboard', hasChild:true, test:'ui/common/platform/clipboard'},
		{title:'Sockets', hasChild: !(isMobileWeb || isTizen), test:'ui/common/platform/sockets', touchEnabled: !(isMobileWeb || isTizen), color:isMobileWeb?"#aaa":"#000"}
	];

	// Add tizen specific tests.
	if (isTizen) {
		data.push({title: 'Tizen', hasChild: true,  test: 'ui/common/platform/tizen'});
	}

	if (Titanium.Platform.name == 'iPhone OS' || isMobileWeb || isTizen) {
		data.push({title:'Passing Data (windows)', hasChild:true, test:'ui/common/platform/custom_properties'});
	}
	
	if (Titanium.Platform.name == 'iPhone OS') {
		data.push({title:'Bonjour', hasChild:true, test:'ui/handheld/ios/platform/bonjour'});
	}
	
	if (Titanium.Platform.osname === 'android') {
		data.push({title: 'Android services', hasChild:true, test:'ui/handheld/android/platform/android_services'});
	}
	
	// create table view
	for (var i = 0; i < data.length; i++ ) {
		var d = data[i];
		// On Android, if touchEnabled is not set explicitly, its value is undefined.
		if (d.touchEnabled !== false) {
			d.color = '#000';
		}
		d.font = {fontWeight:'bold'};
	};
	var tableview = Titanium.UI.createTableView({
		data:data
	});
	
	// create table view event listener
	tableview.addEventListener('click', function(e) {
		if (e.rowData.test) {
			var ExampleWindow = require(e.rowData.test),
				win = new ExampleWindow({title:e.rowData.title,containingTab:self.containingTab});
			self.containingTab.open(win,{animated:true});
		}
	});
	
	// add table view to the window
	self.add(tableview);
	
	return self;
};

module.exports = PlatformWindow;
