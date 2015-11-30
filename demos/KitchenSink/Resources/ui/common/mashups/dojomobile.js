function DojoMobile(_args) {
	var self = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor:'#fff'
	});
	
	var wview = Ti.UI.createWebView({
		url:'http://demos.dojotoolkit.org/demos/mobileGallery/demo-iphone.html'
	});
	
	self.add(wview);
	
	return self;
};

module.exports = DojoMobile;
