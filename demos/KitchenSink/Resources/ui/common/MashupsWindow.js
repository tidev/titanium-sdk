function MashupsWindow(title) {
	var self = Ti.UI.createWindow({
		title:title,
		backgroundColor:'white'
	});

	var isMobileWeb = Titanium.Platform.osname == 'mobileweb',
		isTizen = Titanium.Platform.osname === 'tizen';
	
	// create table view data object
	var data = [
		{title:'Twitter', hasChild:!isMobileWeb, test:'ui/common/mashups/twitter', title_image:'/images/twitter_logo_header.png', touchEnabled:!isMobileWeb, color:isMobileWeb?"#aaa":"#000"},
		{title:'Facebook', hasChild:!isTizen, test:'ui/common/mashups/facebook_test', touchEnabled: !isTizen},
		//{title:'Dojo Mobile', hasChild:true, test:'ui/common/mashups/dojomobile'},
		//{title:'Sencha Touch', hasChild:true, test:'ui/common/mashups/senchatouch'},
		//{title:'jQuery mobile', hasChild:true, test:'ui/common/mashups/jquery_mobile'},
		{title:'YQL', hasChild:true, test:'ui/common/mashups/yql'}
	];
	
	//add iphone specific tests
	if (Titanium.Platform.name == 'iPhone OS') {
		data.push({title:'RSS', hasChild:true, test:'ui/handheld/ios/mashups/rss', barColor:'#b40000'});
	}
	 
	data.push({title:'SOAP', hasChild:!isMobileWeb, test:'ui/common/mashups/soap', touchEnabled:!isMobileWeb, color:isMobileWeb?"#aaa":"#000"});
	
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
				
			if (e.rowData.barColor) {
				win.barColor = e.rowData.barColor;
			}
			if (e.rowData.title_image) {
				win.titleImage = e.rowData.title_image;
			}
			self.containingTab.open(win,{animated:true});
		}
	});
	
	// add table view to the window
	self.add(tableview);
	
	return self;
};

module.exports = MashupsWindow;
