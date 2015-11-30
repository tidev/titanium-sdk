function SenchaTouch(_args) {
	var indicator;
	var win = Ti.UI.createWindow({
		title:_args.title,
		backgroundColor: '#fff'
	});
	var webview = Ti.UI.createWebView({
		url: 'http://dev.sencha.com/deploy/touch/examples/production/kitchensink/'
	});
	win.add(webview);
		
	win.addEventListener('open', function(e) {
		indicator = Ti.UI.createActivityIndicator({
			message: 'Loading Sencha...'
		});
		indicator.show();
	});
	webview.addEventListener('load', function(e) {
		indicator.hide();
	});
	
	return win;
}

module.exports = SenchaTouch;