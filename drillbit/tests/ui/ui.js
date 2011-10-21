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
	},

	appendRowAsArray: asyncTest(function(callback) {
		var w = Ti.UI.createWindow();
		var tv = Ti.UI.createTableView();
		w.add(tv);

		var listener = this.async(function(){
			var rows = [];
			rows.push(Ti.UI.createTableViewRow({title:'title 1'}));
			rows.push(Ti.UI.createTableViewRow({title:'title 2'}));
			rows.push(Ti.UI.createTableViewRow({title:'title 3'}));

			valueOf(function(){tv.appendRow(rows);}).shouldNotThrowException();
			valueOf(tv.data[0].rowCount).shouldBe(rows.length);
		});
		w.addEventListener("open", listener);
		w.open();
	}),

	// http://jira.appcelerator.org/browse/TIMOB-2853
	opacityCrash_as_async: function(callback) {
		var failureTimeout = null;
		var w = Ti.UI.createWindow();
		var btn = Ti.UI.createImageView({
			opacity: 1,
			image: 'KS_nav_ui.png',
			top: 1, width: 50, left: 1, height: 40
		});
		w.add( btn );
		w.addEventListener('open', function() {
			setTimeout(function(){
				if (failureTimeout !== null) {
					clearTimeout(failureTimeout);
				}
				callback.passed();
			}, 1000);
		});
		failureTimeout = setTimeout(function(){
			callback.failed("Test may have crashed app.  Opacity of 1 test.");
		},3000);
		w.open();

	},

	windowOrientation: function() {
		var w = Ti.UI.createWindow();
		valueOf(w.orientation).shouldBeOneOf([Ti.UI.PORTRAIT, Ti.UI.LANDSCAPE_LEFT]);
	},
	
	windowPixelFormat: function() {
		if (Ti.Platform.name === 'android') {
			var w = Ti.UI.createWindow();
			valueOf(w.getWindowPixelFormat).shouldBeFunction();
			valueOf(w.setWindowPixelFormat).shouldBeFunction();
			valueOf("windowPixelFormat" in w).shouldBeTrue();
			
			valueOf(w.windowPixelFormat).shouldBe(Ti.UI.Android.PIXEL_FORMAT_UNKNOWN);
			valueOf(w.getWindowPixelFormat()).shouldBe(Ti.UI.Android.PIXEL_FORMAT_UNKNOWN);
			
			w.windowPixelFormat = Ti.UI.Android.PIXEL_FORMAT_RGB_565;
			valueOf(w.windowPixelFormat).shouldBe(Ti.UI.Android.PIXEL_FORMAT_RGB_565);
			valueOf(w.getWindowPixelFormat()).shouldBe(Ti.UI.Android.PIXEL_FORMAT_RGB_565);
			
			w.setWindowPixelFormat(Ti.UI.Android.PIXEL_FORMAT_RGBA_8888);
			valueOf(w.windowPixelFormat).shouldBe(Ti.UI.Android.PIXEL_FORMAT_RGBA_8888);
			valueOf(w.getWindowPixelFormat()).shouldBe(Ti.UI.Android.PIXEL_FORMAT_RGBA_8888);
		}
	},

	convertPointToView: asyncTest(function() {
		var win = Ti.UI.createWindow({
			width: 100, height: 100
		});

		var view1 = Ti.UI.createView({
			top: 30, left: 30, width: 30, height: 30
		});
		win.add(view1);

		// view1 isn't realized yet -> null
		valueOf(view1.convertPointToView({ x: 0, y: 0 }, win)).shouldBeNull();

		var view2 = Ti.UI.createView({
			bottom: 10, height: 10,
			right: 10, width: 50,
			borderWidth: 5,
			borderColor: "black"
		});
		win.add(view2);

		// view2 isn't realized yet -> null
		valueOf(view2.convertPointToView({ x: 0, y: 0 }, win)).shouldBeNull();

		var detachedView = Ti.UI.createView({
			top: 0, left: 0, width: 50, height: 50
		});

		var detachedWin = Ti.UI.createWindow();

		var scrollView = Ti.UI.createScrollView({
			contentWidth: 200,
			scrollType: "horizontal",
			top: 1, left: 1, width: 50, height: 50
		});
		win.add(scrollView);

		var sView1 = Ti.UI.createView({
			top: 0, left: 10, width: 50, height: 50
		});
		scrollView.add(sView1);

		var sView2 = Ti.UI.createView({
			top: 0, left: 100, width: 50, height: 50
		});
		scrollView.add(sView2);

		var scrolledTests = this.async(function() {
			// scrollRelative should also take into account scroll position
			scrollRelative = sView1.convertPointToView({ x: 5, y: 5 }, scrollView);
			valueOf(scrollRelative).shouldNotBeNull();
			valueOf(scrollRelative).shouldBeObject();
			valueOf(scrollRelative.x).shouldBe(-5);
			valueOf(scrollRelative.y).shouldBe(5);

			// scroll view "off-screen" point -> scrollView
			var scrollRelative2 = sView2.convertPointToView({ x: -10, y: 20 }, scrollView);
			valueOf(scrollRelative2).shouldNotBeNull();
			valueOf(scrollRelative2).shouldBeObject();
			valueOf(scrollRelative2.x).shouldBe(70);
			valueOf(scrollRelative2.y).shouldBe(20);

			winRelative = scrollView.convertPointToView(scrollRelative2, win);
			valueOf(winRelative).shouldNotBeNull();
			valueOf(winRelative).shouldBeObject();
			valueOf(winRelative.x).shouldBe(71);
			valueOf(winRelative.y).shouldBe(21);

			var sView2Relative = win.convertPointToView(winRelative, sView2);
			valueOf(sView2Relative).shouldNotBeNull();
			valueOf(sView2Relative).shouldBeObject();
			valueOf(sView2Relative.x).shouldBe(-10);
			valueOf(sView2Relative.y).shouldBe(20);
		});

		var listener = function(e) {
			// view1 -> win relative
			var winRelative = view1.convertPointToView({ x: 1, y: 1 }, win);
			valueOf(winRelative).shouldNotBeNull();
			valueOf(winRelative).shouldBeObject();
			valueOf(winRelative.x).shouldBe(31);
			valueOf(winRelative.y).shouldBe(31);

			// convert back, x/y should be 1 again
			var view1Relative = win.convertPointToView(winRelative, view1);
			valueOf(view1Relative).shouldNotBeNull();
			valueOf(view1Relative).shouldBeObject();
			valueOf(view1Relative.x).shouldBe(1);
			valueOf(view1Relative.y).shouldBe(1);

			// negative x / y should still work
			var winRelative2 = view2.convertPointToView({ x: -20, y: -20 }, win);
			valueOf(winRelative2).shouldNotBeNull();
			valueOf(winRelative2).shouldBeObject();
			valueOf(winRelative2.x).shouldBe(20);
			valueOf(winRelative2.y).shouldBe(60);

			// ... and back again
			var view2Relative = win.convertPointToView(winRelative2, view2);
			valueOf(view2Relative).shouldNotBeNull();
			valueOf(view2Relative).shouldBeObject();
			valueOf(view2Relative.x).shouldBe(-20);
			valueOf(view2Relative.y).shouldBe(-20);

			// siblings test view1 point -> view2
			view2Relative = view1.convertPointToView({ x: 5, y: -10 }, view2);
			valueOf(view2Relative).shouldNotBeNull();
			valueOf(view2Relative).shouldBeObject();
			valueOf(view2Relative.x).shouldBe(-5);
			valueOf(view2Relative.y).shouldBe(-60);

			// once more, with feeling
			view1Relative = view2.convertPointToView(view2Relative, view1);
			valueOf(view1Relative).shouldNotBeNull();
			valueOf(view1Relative).shouldBeObject();
			valueOf(view1Relative.x).shouldBe(5);
			valueOf(view1Relative.y).shouldBe(-10);

			// ScrollView testing, same pattern as above

			// scroll view "on-screen" point -> scrollView
			var scrollRelative = sView1.convertPointToView({ x: 5, y: 5 }, scrollView);
			valueOf(scrollRelative).shouldNotBeNull();
			valueOf(scrollRelative).shouldBeObject();
			valueOf(scrollRelative.x).shouldBe(15);
			valueOf(scrollRelative.y).shouldBe(5);

			// scrollView relative -> win relative
			winRelative = scrollView.convertPointToView(scrollRelative, win);
			valueOf(winRelative).shouldNotBeNull();
			valueOf(winRelative).shouldBeObject();
			valueOf(winRelative.x).shouldBe(16);
			valueOf(winRelative.y).shouldBe(6);

			// back to sView1 coords
			var sView1Relative = win.convertPointToView(winRelative, sView1);
			valueOf(sView1Relative).shouldNotBeNull();
			valueOf(sView1Relative).shouldBeObject();
			valueOf(sView1Relative.x).shouldBe(5);
			valueOf(sView1Relative.y).shouldBe(5);

			// view is detached, dest is attached -> null
			valueOf(detachedView.convertPointToView({ x: 10, y: 10 }, win)).shouldBeNull();

			// view is attached, dest is detached -> null
			valueOf(view1.convertPointToView({ x: 10, y: 10 }, detachedWin)).shouldBeNull();

			// null point -> throw exception
			valueOf(function() {
				view1.convertPointToView(null, win);
			}).shouldThrowException();

			// no X property -> throw exception
			valueOf(function() {
				view1.convertPointToView({ y: 0 }, win);
			}).shouldThrowException();


			// no Y property -> throw exception
			valueOf(function() {
				view1.convertPointToView({ x: 0 }, win);
			}).shouldThrowException();

			// null x -> throw exception
			valueOf(function() {
				view1.convertPointToView({ x: null, y: 0 }, win);
			}).shouldThrowException();

			// null y -> throw exception
			valueOf(function() {
				view1.convertPointToView({ x: 0, y: null }, win);
			});

			// null destView -> throw exception
			valueOf(function() {
				view1.convertPointToView({ x: 0, y: 0 }, null);
			});

			// non-View destView -> throw exception
			valueOf(function() {
				view1.convertPointToView({ x: 0, y: 0 }, "crashplz");
			}).shouldThrowException();

			// Finally do our async scroll tests, leaving sView1 clipped.
			scrollView.addEventListener("scroll", function(e) {
				// Android doesn't have a scrollEnd event, so this should work in both
				if (e.x == 20) {
					setTimeout(scrolledTests, 1);
				}
			});
			scrollView.scrollTo(20, 0);
		};

		win.addEventListener("open", function() {
			setTimeout(listener, 1000);
		});
		win.open();
	}),
	
	// http://jira.appcelerator.org/browse/TIMOB-1333
	imageLoadEvent: asyncTest(function(callback) {
		var w = Ti.UI.createWindow();
		var btn = Ti.UI.createImageView({
			image: 'KS_nav_ui.png',
			top: 1, width: 50, left: 1, height: 40
		});
		var listener = this.async(function() {
		 	Ti.API.debug("load event fired.");
		});
		btn.addEventListener("load", listener)
		w.add( btn );
		w.open();
	})
});
