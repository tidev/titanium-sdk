function xhr(_args) {
	var self = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor:'#fff'
	}),
		
		// if we're mobile web, don't make the rows touch enabled
		isMobileWeb = Ti.Platform.osname == "mobileweb";
		Ti.API.info("isMobileWeb:"+isMobileWeb+" !"+!isMobileWeb);
	// create table view data object
	var data = [	
		{title:'Error Callback', hasChild:true, test:'ui/common/platform/xhr_error',backgroundColor:'#fff',color:"#000"},
		{title:'Binary Data', hasChild:!isMobileWeb, test:'ui/common/platform/xhr_binarydata', touchEnabled:!isMobileWeb, color:isMobileWeb?"#aaa":"#000",backgroundColor:'#fff'},
		{title:'XML Data', hasChild:!isMobileWeb, test:'ui/common/platform/xhr_xml', touchEnabled:!isMobileWeb, color:isMobileWeb?"#aaa":"#000",backgroundColor:'#fff'},
		{title:'XML Properties', hasChild:!isMobileWeb, test:'ui/common/platform/xhr_properties', touchEnabled:!isMobileWeb, color:isMobileWeb?"#aaa":"#000",backgroundColor:'#fff'},
		{title:'File Download', hasChild:!isMobileWeb, test:'ui/common/platform/xhr_filedownload', touchEnabled:!isMobileWeb, color:isMobileWeb?"#aaa":"#000",backgroundColor:'#fff'},
		{title:'UTF-8 + GET/POST', hasChild:!isMobileWeb, test:'ui/common/platform/xhr_utf8', touchEnabled:!isMobileWeb, color:isMobileWeb?"#aaa":"#000",backgroundColor:'#fff'},
		{title:'Cookies', hasChild:!isMobileWeb, test:'ui/common/platform/xhr_cookie', touchEnabled:!isMobileWeb, color:isMobileWeb?"#aaa":"#000",backgroundColor:'#fff'},
		{title:'setTimeout', hasChild:true, test:'ui/common/platform/xhr_settimeout',backgroundColor:'#fff',color:"#000"}
	];
	
	// add iphone specific tests
	if (Titanium.Platform.name == 'iPhone OS')
	{
		data.push({title:'File Upload', hasChild:true, test:'ui/handheld/ios/platform/xhr_fileupload'});
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

module.exports = xhr;
