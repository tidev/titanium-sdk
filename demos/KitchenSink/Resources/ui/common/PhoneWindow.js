function PhoneWindow(title) {
	var self = Ti.UI.createWindow({
		title:title,
		backgroundColor:'white'
	});
	
	var isMobileWeb = Titanium.Platform.osname == 'mobileweb',
		isTizen = Titanium.Platform.osname == 'tizen';
		
	// create table view data object
	var data = [
		{title:'Play Movie', hasChild:true, test:'ui/common/phone/movie'}
	];
	if (Ti.Platform.model != 'Kindle Fire') {
		data.push({title:'Vibrate', hasChild:true, test:'ui/common/phone/vibrate'});
		data.push({title:'Geolocation', hasChild:true, test:'ui/common/phone/geolocation'});
		data.push({title:'Accelerometer', hasChild:true, test:'ui/common/phone/accelerometer'});
	}
	
	if ( !(Ti.Platform.model === 'Kindle Fire' || isMobileWeb) ) {
		data.push({title:'Contacts', hasChild:true, test:'ui/common/phone/contacts'});
	}
	data.push({title:'Sound', hasChild:!isMobileWeb, test:'ui/common/phone/sound', touchEnabled:!isMobileWeb, color:isMobileWeb?"#aaa":"#000"});
	data.push({title:'Photo Gallery', hasChild:!isMobileWeb, test:'ui/common/phone/photo_gallery', touchEnabled:!isMobileWeb, color:isMobileWeb?"#aaa":"#000"});
	
	data.push({title:'Orientation', hasChild:true, test:'ui/common/phone/orientation'});
	
	
	//Donot include camera if it is iPad 1st gen.
	if ((Titanium.Platform.model !== 'iPad1,1') && ( Ti.Platform.model != 'Kindle Fire')) {
		data.push({title:'Camera', hasChild:!isMobileWeb, test:'ui/common/phone/camera', touchEnabled:!isMobileWeb, color:isMobileWeb?"#aaa":"#000"});
	}
	
	// add iphone specific tests
	if (Titanium.Platform.name == 'iPhone OS') {
		data.push({title:'Screenshot', hasChild:true, test:'ui/handheld/ios/phone/screenshot'});
		data.push({title:'Save to Gallery', hasChild:true, test:'ui/handheld/ios/phone/photo_gallery_save'});
	}

	// Add tizen specific tests.
	if (isTizen) {
		data.push({title: 'Screenshot', hasChild: true, test: 'ui/handheld/tizen/phone/screenshot'});
		data.push({title: 'Save to Gallery', hasChild: true, test: 'ui/handheld/tizen/phone/photo_gallery_save'});
	}

	if (Titanium.Platform.name !== 'android') {
		data.push({title:'Shake', hasChild:true, test:'ui/common/phone/shake'});
	}
	
	if (Titanium.Platform.name == 'iPhone OS') {
		if (Titanium.Platform.osname!='ipad')
		{
			data.push({title:'Record Video', hasChild:true, test:'ui/common/phone/record_video'});
		}
		data.push({title:'Music', hasChild:true, test:'ui/handheld/ios/phone/music'});
		data.push({title:'Proximity Events', hasChild:true, test:'/etc/todo'});
		data.push({title:'App Badge', hasChild:true, test:'ui/handheld/ios/phone/app_badge'});
		data.push({title:'Push Notifications', hasChild:true, test:'ui/handheld/ios/phone/push_notification'});
	}
	
	if (Titanium.Platform.name == 'android') {
		data.push({title:'Notfications', hasChild:true, test:'ui/handheld/android/phone/notification'});
	}
	
	if (Titanium.Platform.osname == 'ipad') {
		data.push({title:'iPad Features', hasChild:true, test:'ui/handheld/ios/phone/ipad_feature'});	
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

module.exports = PhoneWindow;
