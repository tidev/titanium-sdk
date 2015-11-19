function BaseUIWindow(title) {
	var self = Ti.UI.createWindow({
		title:title,
		backgroundColor:'white'
	});
	
	var isMobileWeb = Titanium.Platform.osname == 'mobileweb';
	
	// create table view data object
	var data = [
		{title:'Tab Groups', hasChild:!isMobileWeb, test:'ui/common/baseui/tab_groups', touchEnabled:!isMobileWeb, color:isMobileWeb?"#aaa":"#000"},
		{title:'Window Properties', hasChild:true, test:'ui/common/baseui/window_properties'},
		{title:'Window Layout', hasChild:true, test:'ui/common/baseui/window_layout'},
		{title:'Window (Standalone)', hasChild:true, test:'ui/common/baseui/window_standalone'},
		{title:'Views', hasChild:true, test:'ui/common/baseui/views'},
		{title:'Custom Events', hasChild:true, test:'ui/common/baseui/custom_events'},
		{title:'Window Events', hasChild:true, test:'ui/common/baseui/window_events'},
		{title:'Vertical Layout', hasChild:true, test:'ui/common/baseui/vertical_layout'},
		{title:'Horizontal Layout', hasChild:true, test:'ui/common/baseui/horizontal_layout'}
	];
	
	// add iphone specific tests
	if (Titanium.Platform.name == 'iPhone OS')
	{
		data.push({title:'Tabs', hasChild:true, test:'ui/handheld/ios/baseui/tabs'});
		data.push({title:'Window NavBar', hasChild:true, test:'ui/handheld/ios/baseui/window_navbar'});
		data.push({title:'Window Toolbar', hasChild:true, test:'ui/handheld/ios/baseui/window_toolbar'});
		data.push({title:'Window Constructor', hasChild:true, test:'ui/handheld/ios/baseui/window_constructor'});
		data.push({title:'Animation', hasChild:true, test:'ui/handheld/ios/baseui/animation'});
		if (Ti.version < '3.2.0') {
			data.push({title:'Nav Group', hasChild:true, test:'ui/handheld/ios/baseui/navgroup'});
		}
	
		Ti.include("/etc/version.js");
	
		if (isIPhone3_2_Plus())
		{
			data.push({title:'Modal Windows', hasChild:true, test:'ui/handheld/ios/baseui/modal_windows'});
			data.push({title:'Custom Fonts', hasChild:true, test:'ui/handheld/ios/baseui/custom_fonts'});
		}
	}
	
	// add android specific tests
	if (Titanium.Platform.osname == 'android')
	{
		data.push({title:'Preferences', hasChild:true, test:'ui/handheld/android/baseui/preferences'});
	    data.push({title:'Hide Soft Keyboard (Android)', hasChild:true, test:'ui/handheld/android/baseui/android_hide_softkeyboard'});
	    data.push({title: 'Window Soft Input (Android)', hasChild:true, test:'ui/handheld/android/baseui/android_window_soft_input_mode'});
	    data.push({title: 'Menu (Android)', hasChild:true, test:'ui/handheld/android/baseui/android_menus'});
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
	tableview.addEventListener('click', function(e)
	{
		if (e.rowData.test)
		{
			var ExampleWindow = require(e.rowData.test),
				win = new ExampleWindow({title:e.rowData.title,containingTab:self.containingTab,tabGroup:self.tabGroup});
			if (Ti.Platform.name == "android") {
				
			} else {
				win.backgroundColor = "#fff"
			}
	
	
			if (e.index == 3)
			{
				if (Ti.Platform.name == "iPhone OS") {
					win.hideTabBar();
					//IOS7 has a weird bug where it will not resize the ViewController correctly when the tabbar is hidden.
					//TIMOB-14998
					win.extendEdges = [Ti.UI.EXTEND_EDGE_BOTTOM];
					win.includeOpaqueBars = true;
				}
			}
			if (Ti.Platform.name==='android' && e.rowData.test.indexOf('window_properties') >= 0) {
				// As explained in apidoc for Window, if opacity is ever to be changed for an Android
				// activity during its lifetime, it needs to use a translucent background.  We trigger
				// using a translucent theme by the presence of the opacity property, so we need to
				// set it here.  Setting it to 1 means it's totally opaque, but gives us the property to
				// make it more transparent later with the "toggle opacity" test.
				win.backgroundColor = "#191919"
				win.opacity = 1;
			}
			self.containingTab.open(win,{animated:true});
		}
	});
	
	// add table view to the window
	self.add(tableview);
	
	self.addEventListener('focus', function()
	{
		Ti.API.info('FOCUS RECEIVED IN base_ui');
		Ti.App.fireEvent('nav_back');
		
		if (!(Ti.Platform.osname === 'mobileweb' || Ti.Platform.osname === 'tizen' || Ti.Platform.osname === 'blackberry')) {
			Ti.API.info(Ti.dumpCoverage());
		}
	});
	if ( (Ti.Platform.osname != 'blackberry') && (Ti.Platform.osname != 'android') ){
		//
		//  ADD EVENT LISTENERS FOR CUSTOM EVENTS
		//
		var win = Titanium.UI.createWindow({
			height:30,
			width:250,
			bottom:110,
			borderRadius:10
		});
		
		var view = Titanium.UI.createView({
			backgroundColor:'#000',
			opacity:0.7,
			height:30,
			width:250,
			borderRadius:10
		});
		
		var label = Titanium.UI.createLabel({
			color:'#fff',
			font:{fontSize:13},
			textAlign:'center',
			width:Ti.UI.SIZE,
			height:Ti.UI.SIZE
		});
		win.add(view);
		win.add(label);
	} else if (Ti.Platform.osname != 'android'){
		var toast = Ti.BlackBerry.createToast();
	}
	
	function createAndroidToast(message) {
		var theToast = Ti.UI.createNotification({
			message:message,
    		duration: Ti.UI.NOTIFICATION_DURATION_SHORT
		});
		theToast.show();
	}
	
	Titanium.App.addEventListener('event_one', function(e)
	{
		if(Ti.Platform.osname == 'blackberry') {
			toast.cancel();
			toast.message = 'base_ui.js: event one, array length = ' + e.data.length;
			toast.show();
		} else if (Ti.Platform.osname == 'android') {
			var msg = 'base_ui.js: event one, array length = ' + e.data.length;
			createAndroidToast(msg);
		} else {
			label.text = 'base_ui.js: event one, array length = ' + e.data.length;
			win.open();
			setTimeout(function()
			{
				win.close({opacity:0,duration:500});
			},1000);
		}
	});
	
	Titanium.App.addEventListener('event_two', function(e)
	{
		if(Ti.Platform.osname == 'blackberry') {
			toast.cancel();
			toast.message = 'base_ui.js: event two, name = ' + e.name;
			toast.show();
		} else if (Ti.Platform.osname == 'android') {
			var msg = 'base_ui.js: event two, name = ' + e.name;
			createAndroidToast(msg);
		} else {
			label.text = 'base_ui.js: event two, name = ' + e.name;
			win.open();
			setTimeout(function()
			{
				win.close({opacity:0,duration:500});
			},1000);
		}
	});

	
	return self;
};

module.exports = BaseUIWindow;
