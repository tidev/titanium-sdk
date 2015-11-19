function jQueryMobile(_args) {
	var indicator;
	var win = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor: '#fff'
	});
	var webview = Ti.UI.createWebView({
		url: 'http://jquerymobile.com/demos/1.1.0/'
	});
	win.add(webview);
		
	win.addEventListener('open', function(e) {
		indicator = Ti.UI.createActivityIndicator({
			message: 'Loading jQuery Mobile...'
		});
		indicator.show();
	});
	webview.addEventListener('load', function(e) {
		indicator.hide();
	});
	
	return win;
};

module.exports = jQueryMobile;
