describe("Ti.UI tests", {

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2583
	webviewEvalJSLockup: asyncTest( {
		start: function(callback) {
			var w = Ti.UI.createWindow();
			w.open();
			var wv = Ti.UI.createWebView({top: 0, width: 10, height: 10, url: 'test.html'});
			var listener = this.async(function(){
				valueOf(wv.evalJS('Mickey')).shouldBe('');
				//w.close();
			});
			wv.addEventListener('load', listener);
			w.add(wv);
		},
		timeout: 10000,
		timeoutError: 'Timed out waiting for page to load and JS to eval'
	}),
	//https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/1036
	webviewBindingUnavailable: asyncTest( {
		start: function(callback) {
			var w = Ti.UI.createWindow();
			w.open();
			var wv = Ti.UI.createWebView({top: 0, width: 10, height: 10, url: 'http://www.google.com'});
			var listener = this.async(function(){
				valueOf(wv.evalJS('Titanium')).shouldBe('');
				//w.close();
			});
			wv.addEventListener('load', listener);
			w.add(wv);
		},
		timeout: 10000,
		timeoutError: 'Timed out waiting for page to load and JS to eval'
	}),
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2153
	webviewBindingAvailable: asyncTest( {
		start: function(callback) {
			var w = Ti.UI.createWindow();
			w.open();
			var wv = Ti.UI.createWebView({top: 0, width: 10, height: 10, url: 'test.html'});
			var listener = this.async(function(){
				valueOf(wv.evalJS('typeof Titanium')).shouldBe('object');
				//w.close();
			});
			wv.addEventListener('load', listener);
			w.add(wv);
		},
		timeout: 10000,
		timeoutError: 'Timed out waiting for page to load and JS to eval'
	}),
	webviewBindingAvailableAfterSetHtml: asyncTest( {
		start: function(callback) {
			var w = Ti.UI.createWindow();
			w.open();
			var wv = Ti.UI.createWebView({top: 0, width: 10, height: 10});
			var listener = this.async(function(){
				valueOf(wv.evalJS('typeof Titanium')).shouldBe('object');
				//w.close();
			});
			wv.addEventListener('load', listener);
			w.add(wv);
			wv.html = "<html><body>x</body></html>";
		},
		timeout: 10000,
		timeoutError: 'Timed out waiting for page to load and JS to eval'
	}),

	//https://appcelerator.lighthouseapp.com/projects/32238/tickets/2443-android-paths-beginning-with-are-not-recognised
	dotslashWindow: function() {
		var w = Ti.UI.createWindow({url:'./testwin.js'});
		valueOf(function(){w.open();}).shouldNotThrowException();
	},

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2230-android-resolve-url-failing-from-event-context#ticket-2230-6
	absoluteAndRelativeWinURLs: asyncTest( {
		start: function(callback) {
			var w = Ti.UI.createWindow({ url: 'dir/relative.js' });
			w.addEventListener("close", this.async(function() {
				valueOf(true).shouldBe(true);
			}));
			w.open();
		},
		timeout: 10000,
		timeoutError: 'Timed out waiting for relative and absolute window to auto close'
	}),
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/873
	appendRowWithHeader_as_async: function(callback) {
		var w = Ti.UI.createWindow();
		w.open();
		var data = [Ti.UI.createTableViewRow({title: 'blah'})];
		var tv = Ti.UI.createTableView({data:data});
		w.add(tv);
		setTimeout(function(){
			tv.appendRow( Ti.UI.createTableViewRow({title:'blah2', header:'header1'}) );
			setTimeout(function() {
				valueOf(tv.data.length).shouldBe(2);
				callback.passed();
			}, 1000);
		},1000);
	}
});
