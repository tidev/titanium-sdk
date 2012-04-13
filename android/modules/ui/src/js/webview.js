exports.bootstrap = function(Titanium) {
	var createWebView = Titanium.UI.createWebView;
	function createWebViewWrapper() {
		var webView = createWebView.apply(this, arguments);
		webView.onCreateWindow = function(e) {
			if (!e.isUserGesture) {
				return null;
			}

			var win = Titanium.UI.createWindow({}, {
				fullscreen: false  // Force new activity.
			});
			var newWebView = Titanium.UI.createWebView();
			win.add(newWebView);
			win.open();
			return newWebView;
		}
		return webView;
	}

	Titanium.UI.createWebView = createWebViewWrapper;
}
