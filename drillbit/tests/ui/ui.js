describe("Ti.UI tests", {

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2583
	evalJSLockup: asyncTest( {
		start: function(callback) {
			var w = Ti.UI.createWindow();
			w.open();
			var wv = Ti.UI.createWebView({top: 0, width: 10, height: 10, url: 'test.html'});
			var listener = this.async(function(){
				valueOf(wv.evalJS('Mickey')).shouldBe('');
				w.close();
			});
			wv.addEventListener('load', listener);
			w.add(wv);
		},
		timeout: 10000,
		timeoutError: 'Timed out waiting for page to load and JS to eval'
	}),

});
