/* globals OS_ANDROID */
if (OS_ANDROID) {
	const createWebView = Titanium.UI.createWebView;
	function createWebViewWrapper(...args) {
		const webView = createWebView.apply(this, args);
		webView.onCreateWindow = function (e) {
			if (!e.isUserGesture) {
				return null;
			}

			const win = Titanium.UI.createWindow({}, {
				fullscreen: false  // Force new activity.
			});
			const newWebView = Titanium.UI.createWebView();
			win.add(newWebView);
			win.open();
			return newWebView;
		};
		return webView;
	}

	Titanium.UI.createWebView = createWebViewWrapper;
}
