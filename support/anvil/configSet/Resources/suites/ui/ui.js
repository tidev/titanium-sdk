/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "ui";
	this.tests = [
		{name: "webviewEvalJSLockup", timeout: 10000},
		{name: "webviewBindingUnavailable", timeout: 15000},
		{name: "webviewBindingAvailable", timeout: 10000},
		{name: "webviewBindingAvailableAfterSetHtml", timeout: 10000},
		{name: "webviewFireEvent", timeout: 10000},
		{name: "dotslashWindow"},
		{name: "absoluteAndRelativeWinURLs", timeout: 10000},
		{name: "appendRowWithHeader"},
		{name: "appendRowAsArray"},
		{name: "opacityCrash"},
		{name: "windowOrientation"},
		{name: "windowPixelFormat"},
		{name: "convertPointToView"},
		{name: "imageLoadEvent", timeout: 10000},
		{name: "tabWindowNull"},
		{name: "deleteCorrectRowIndex", timeout: 3000},
		{name: "childrenArrayEmpty"}
	]

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2583
	this.webviewEvalJSLockup = function(testRun) {
		var w = Ti.UI.createWindow();
		w.open();
		var wv = Ti.UI.createWebView({top: 0, width: 10, height: 10, url: 'test.html'});
		var listener = function(){
			valueOf(testRun, wv.evalJS('Mickey')).shouldBe('');
			//w.close();

			finish(testRun);
		};
		wv.addEventListener('load', listener);
		w.add(wv);
	}

	//https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/1036
	this.webviewBindingUnavailable = function(testRun) {
		var w = Ti.UI.createWindow();
		w.open();
		var wv = Ti.UI.createWebView({top: 0, width: 10, height: 10, url: 'http://www.google.com'});
		var listener = function(){
			valueOf(testRun, wv.evalJS('Titanium')).shouldBe('');
			//w.close();

			finish(testRun);
		};
		wv.addEventListener('load', listener);
		w.add(wv);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2153
	this.webviewBindingAvailable = function(testRun) {
		var w = Ti.UI.createWindow();
		w.open();
		var wv = Ti.UI.createWebView({top: 0, width: 10, height: 10, url: 'test.html'});
		var listener = function(){
			valueOf(testRun, wv.evalJS('typeof Titanium')).shouldBe('object');
			//w.close();

			finish(testRun);
		};
		wv.addEventListener('load', listener);
		w.add(wv);
	}

	this.webviewBindingAvailableAfterSetHtml = function(testRun) {
		var w = Ti.UI.createWindow();
		w.open();
		var wv = Ti.UI.createWebView({top: 0, width: 10, height: 10});
		var listener = function(){
			valueOf(testRun, wv.evalJS('typeof Titanium')).shouldBe('object');
			//w.close();

			finish(testRun);
		};
		wv.addEventListener('load', listener);
		w.add(wv);
		wv.html = "<html><body>x</body></html>";
	}

	this.webviewFireEvent = function(testRun) {
		var w = Ti.UI.createWindow();
		w.open();

		function onEventFired(e) {
			valueOf(testRun, e.object).shouldBeObject();
			valueOf(testRun, e.object.string).shouldBeString();
			valueOf(testRun, e.object.number).shouldBeNumber();
			valueOf(testRun, e.object.nullObject).shouldBeNull();
			valueOf(testRun, e.object.array).shouldBeArray();

			valueOf(testRun, e.object.array.length).shouldBe(4);
			valueOf(testRun, e.object.array[0]).shouldBeObject();
			valueOf(testRun, e.object.array[1]).shouldBeString();
			valueOf(testRun, e.object.array[2]).shouldBeNumber();
			valueOf(testRun, e.object.array[3]).shouldBeNull();

			Ti.App.removeEventListener('webViewEvent', onEventFired);
			finish(testRun);
		}

		Ti.App.addEventListener('webViewEvent', onEventFired);

		var wv = Ti.UI.createWebView({url: 'test-fire-event.html'});
		w.add(wv);
	}

	//https://appcelerator.lighthouseapp.com/projects/32238/tickets/2443-android-paths-beginning-with-are-not-recognised
	this.dotslashWindow = function(testRun) {
		var w = Ti.UI.createWindow({url:'./testwin.js'});
		valueOf(testRun, function(){w.open();}).shouldNotThrowException();

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2230-android-resolve-url-failing-from-event-context#ticket-2230-6
	this.absoluteAndRelativeWinURLs = function(testRun) {
		var w = Ti.UI.createWindow({ url: 'dir/relative.js' });
		w.addEventListener("close", function() {
			valueOf(testRun, true).shouldBe(true);

			finish(testRun);
		});
		w.open();
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/873
	this.appendRowWithHeader = function(testRun) {
		var w = Ti.UI.createWindow();
		w.open();
		var data = [Ti.UI.createTableViewRow({title: 'blah'})];
		var tv = Ti.UI.createTableView({data:data});
		w.add(tv);
		setTimeout(function(){
			tv.appendRow( Ti.UI.createTableViewRow({title:'blah2', header:'header1'}) );
			setTimeout(function() {
				valueOf(testRun, tv.data.length).shouldBe(2);
				finish(testRun);
			}, 1000);
		},1000);
	}

	this.appendRowAsArray = function(testRun) {
		var w = Ti.UI.createWindow();
		var tv = Ti.UI.createTableView();
		w.add(tv);

		var listener = function(){
			var rows = [];
			rows.push(Ti.UI.createTableViewRow({title:'title 1'}));
			rows.push(Ti.UI.createTableViewRow({title:'title 2'}));
			rows.push(Ti.UI.createTableViewRow({title:'title 3'}));

			valueOf(testRun, function(){tv.appendRow(rows);}).shouldNotThrowException();
			valueOf(testRun, tv.data[0].rowCount).shouldBe(rows.length);

			finish(testRun);
		};
		w.addEventListener("open", listener);
		w.open();
	}

	// http://jira.appcelerator.org/browse/TIMOB-2853
	this.opacityCrash = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var failureTimeout = null;
		var w = Ti.UI.createWindow();
		var btn = Ti.UI.createImageView({
			opacity: 1,
			image: 'KS_nav_ui.png',
			top: 1, width: 50, left: 1, height: 40
		});
		w.add(btn);
		w.addEventListener('open', function() {
			setTimeout(function(){
				if (failureTimeout !== null) {
					clearTimeout(failureTimeout);
				}
				finish(testRun);
			}, 1000);
		});
		failureTimeout = setTimeout(function(){
			callback_error("Test may have crashed app.  Opacity of 1 test.");
		},3000);
		w.open();
	}

	this.windowOrientation = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var w = Ti.UI.createWindow();
		valueOf(testRun, w.orientation).shouldBeOneOf([Ti.UI.PORTRAIT, Ti.UI.LANDSCAPE_LEFT]);
		
		w.addEventListener('open', function() {
			w.orientationModes = [Ti.UI.PORTRAIT, Ti.UI.LANDSCAPE_LEFT];
			valueOf(testRun, w.orientationModes).shouldNotBeNull();

			// Make sure the the values are integers
			valueOf(testRun, parseInt(w.orientationModes[0]) == parseFloat(w.orientationModes[0])).shouldBeTrue();
			valueOf(testRun, parseInt(w.orientationModes[1]) == parseFloat(w.orientationModes[1])).shouldBeTrue();
			valueOf(testRun, w.orientationModes[0]).shouldBe(Ti.UI.PORTRAIT);
			valueOf(testRun, w.orientationModes[1]).shouldBe(Ti.UI.LANDSCAPE_LEFT);
			
			setTimeout(function(){
				if (failureTimeout !== null) {
					clearTimeout(failureTimeout);
				}
				finish(testRun);
			}, 1000);
		});
		failureTimeout = setTimeout(function(){
			callback_error("Test may have crashed app.  Opacity of 1 test.");
		},3000);
		
		w.open();
	}

	this.windowPixelFormat = function(testRun) {
		if (Ti.Platform.name === 'android') {
			var w = Ti.UI.createWindow();
			valueOf(testRun, w.getWindowPixelFormat).shouldBeFunction();
			valueOf(testRun, w.setWindowPixelFormat).shouldBeFunction();
			valueOf(testRun, "windowPixelFormat" in w).shouldBeTrue();
			
			valueOf(testRun, w.windowPixelFormat).shouldBe(Ti.UI.Android.PIXEL_FORMAT_UNKNOWN);
			valueOf(testRun, w.getWindowPixelFormat()).shouldBe(Ti.UI.Android.PIXEL_FORMAT_UNKNOWN);
			
			w.windowPixelFormat = Ti.UI.Android.PIXEL_FORMAT_RGB_565;
			valueOf(testRun, w.windowPixelFormat).shouldBe(Ti.UI.Android.PIXEL_FORMAT_RGB_565);
			valueOf(testRun, w.getWindowPixelFormat()).shouldBe(Ti.UI.Android.PIXEL_FORMAT_RGB_565);
			
			w.setWindowPixelFormat(Ti.UI.Android.PIXEL_FORMAT_RGBA_8888);
			valueOf(testRun, w.windowPixelFormat).shouldBe(Ti.UI.Android.PIXEL_FORMAT_RGBA_8888);
			valueOf(testRun, w.getWindowPixelFormat()).shouldBe(Ti.UI.Android.PIXEL_FORMAT_RGBA_8888);
		}

		finish(testRun);
	}

	this.convertPointToView = function(testRun) {
		var win = Ti.UI.createWindow({
			width: 100, height: 100
		});

		var view1 = Ti.UI.createView({
			top: 30, left: 30, width: 30, height: 30
		});
		win.add(view1);

		// view1 isn't realized yet -> null
		valueOf(testRun, view1.convertPointToView({ x: 0, y: 0 }, win)).shouldBeNull();

		var view2 = Ti.UI.createView({
			bottom: 10, height: 10,
			right: 10, width: 50,
			borderWidth: 5,
			borderColor: "black"
		});
		win.add(view2);

		// view2 isn't realized yet -> null
		valueOf(testRun, view2.convertPointToView({ x: 0, y: 0 }, win)).shouldBeNull();

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

		var scrolledTests = function() {
			// scrollRelative should also take into account scroll position
			scrollRelative = sView1.convertPointToView({ x: 5, y: 5 }, scrollView);
			valueOf(testRun, scrollRelative).shouldNotBeNull();
			valueOf(testRun, scrollRelative).shouldBeObject();
			valueOf(testRun, scrollRelative.x).shouldBe(-5);
			valueOf(testRun, scrollRelative.y).shouldBe(5);

			// scroll view "off-screen" point -> scrollView
			var scrollRelative2 = sView2.convertPointToView({ x: -10, y: 20 }, scrollView);
			valueOf(testRun, scrollRelative2).shouldNotBeNull();
			valueOf(testRun, scrollRelative2).shouldBeObject();
			valueOf(testRun, scrollRelative2.x).shouldBe(70);
			valueOf(testRun, scrollRelative2.y).shouldBe(20);

			winRelative = scrollView.convertPointToView(scrollRelative2, win);
			valueOf(testRun, winRelative).shouldNotBeNull();
			valueOf(testRun, winRelative).shouldBeObject();
			valueOf(testRun, winRelative.x).shouldBe(71);
			valueOf(testRun, winRelative.y).shouldBe(21);

			var sView2Relative = win.convertPointToView(winRelative, sView2);
			valueOf(testRun, sView2Relative).shouldNotBeNull();
			valueOf(testRun, sView2Relative).shouldBeObject();
			valueOf(testRun, sView2Relative.x).shouldBe(-10);
			valueOf(testRun, sView2Relative.y).shouldBe(20);
		};

		var listener = function(e) {
			// view1 -> win relative
			var winRelative = view1.convertPointToView({ x: 1, y: 1 }, win);
			valueOf(testRun, winRelative).shouldNotBeNull();
			valueOf(testRun, winRelative).shouldBeObject();
			valueOf(testRun, winRelative.x).shouldBe(31);
			valueOf(testRun, winRelative.y).shouldBe(31);

			// convert back, x/y should be 1 again
			var view1Relative = win.convertPointToView(winRelative, view1);
			valueOf(testRun, view1Relative).shouldNotBeNull();
			valueOf(testRun, view1Relative).shouldBeObject();
			valueOf(testRun, view1Relative.x).shouldBe(1);
			valueOf(testRun, view1Relative.y).shouldBe(1);

			// negative x / y should still work
			var winRelative2 = view2.convertPointToView({ x: -20, y: -20 }, win);
			valueOf(testRun, winRelative2).shouldNotBeNull();
			valueOf(testRun, winRelative2).shouldBeObject();
			valueOf(testRun, winRelative2.x).shouldBe(20);
			valueOf(testRun, winRelative2.y).shouldBe(60);

			// ... and back again
			var view2Relative = win.convertPointToView(winRelative2, view2);
			valueOf(testRun, view2Relative).shouldNotBeNull();
			valueOf(testRun, view2Relative).shouldBeObject();
			valueOf(testRun, view2Relative.x).shouldBe(-20);
			valueOf(testRun, view2Relative.y).shouldBe(-20);

			// siblings test view1 point -> view2
			view2Relative = view1.convertPointToView({ x: 5, y: -10 }, view2);
			valueOf(testRun, view2Relative).shouldNotBeNull();
			valueOf(testRun, view2Relative).shouldBeObject();
			valueOf(testRun, view2Relative.x).shouldBe(-5);
			valueOf(testRun, view2Relative.y).shouldBe(-60);

			// once more, with feeling
			view1Relative = view2.convertPointToView(view2Relative, view1);
			valueOf(testRun, view1Relative).shouldNotBeNull();
			valueOf(testRun, view1Relative).shouldBeObject();
			valueOf(testRun, view1Relative.x).shouldBe(5);
			valueOf(testRun, view1Relative.y).shouldBe(-10);

			// ScrollView testing, same pattern as above

			// scroll view "on-screen" point -> scrollView
			var scrollRelative = sView1.convertPointToView({ x: 5, y: 5 }, scrollView);
			valueOf(testRun, scrollRelative).shouldNotBeNull();
			valueOf(testRun, scrollRelative).shouldBeObject();
			valueOf(testRun, scrollRelative.x).shouldBe(15);
			valueOf(testRun, scrollRelative.y).shouldBe(5);

			// scrollView relative -> win relative
			winRelative = scrollView.convertPointToView(scrollRelative, win);
			valueOf(testRun, winRelative).shouldNotBeNull();
			valueOf(testRun, winRelative).shouldBeObject();
			valueOf(testRun, winRelative.x).shouldBe(16);
			valueOf(testRun, winRelative.y).shouldBe(6);

			// back to sView1 coords
			var sView1Relative = win.convertPointToView(winRelative, sView1);
			valueOf(testRun, sView1Relative).shouldNotBeNull();
			valueOf(testRun, sView1Relative).shouldBeObject();
			valueOf(testRun, sView1Relative.x).shouldBe(5);
			valueOf(testRun, sView1Relative.y).shouldBe(5);

			// view is detached, dest is attached -> null
			valueOf(testRun, detachedView.convertPointToView({ x: 10, y: 10 }, win)).shouldBeNull();

			// view is attached, dest is detached -> null
			valueOf(testRun, view1.convertPointToView({ x: 10, y: 10 }, detachedWin)).shouldBeNull();

			// null point -> throw exception
			valueOf(testRun, function() {
				view1.convertPointToView(null, win);
			}).shouldThrowException();

			// no X property -> throw exception
			valueOf(testRun, function() {
				view1.convertPointToView({ y: 0 }, win);
			}).shouldThrowException();


			// no Y property -> throw exception
			valueOf(testRun, function() {
				view1.convertPointToView({ x: 0 }, win);
			}).shouldThrowException();

			// null x -> throw exception
			valueOf(testRun, function() {
				view1.convertPointToView({ x: null, y: 0 }, win);
			}).shouldThrowException();

			// null y -> throw exception
			valueOf(testRun, function() {
				view1.convertPointToView({ x: 0, y: null }, win);
			}).shouldThrowException();

			// null destView -> throw exception
			valueOf(testRun, function() {
				view1.convertPointToView({ x: 0, y: 0 }, null);
			}).shouldThrowException();

			// non-View destView -> throw exception
			valueOf(testRun, function() {
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

			finish(testRun);
		};

		win.addEventListener("open", function() {
			setTimeout(listener, 1000);
		});
		win.open();
	}

	// http://jira.appcelerator.org/browse/TIMOB-1333
	this.imageLoadEvent = function(testRun) {
		//TODO: Genericize this test for all platforms,
		//and check to see what proper behavior/parity is.
		if (Ti.Platform.osname === 'android') {
			var w = Ti.UI.createWindow();
			var btn = Ti.UI.createImageView({
				image: 'KS_nav_ui.png',
				top: 1, width: 50, left: 1, height: 40
			});
			var listener = function() {
				Ti.API.debug("load event fired.");
				valueOf(testRun, true).shouldBe(true);

				finish(testRun);
			};
			btn.addEventListener("load", listener)
			w.add(btn);
			w.open();
		} else {
			Ti.API.info("Only testing load events on local resources in Android");
			finish(testRun);
		}
	}

	// http://jira.appcelerator.org/browse/TIMOB-6891
	this.tabWindowNull = function(testRun) {
		valueOf(testRun, function() {
			Ti.UI.createTab({window: Ti.UI.createWindow()}).
				window.addEventListener("focus", function(){});
		}).shouldNotThrowException();

		finish(testRun);
	}

	// http://jira.appcelerator.org/browse/TIMOB-6858
	this.deleteCorrectRowIndex = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var data = [];
		for (var i = 0; i < 2; i++) {
			data.push(Ti.UI.createTableViewRow({title: "row " + i}));
		}
		var tv = Ti.UI.createTableView({data: data});
		var w = Ti.UI.createWindow();
		w.addEventListener("open", function() {
			var section = tv.data[0];
			if (section.rows.length !== 2) {
				callback_error("Expected initial data set to contain 2 rows");
			}
			tv.deleteRow(1);
			setTimeout(function() {
				if (section.rows.length !== 1) {
					callback_error("Expected table view section to contain 1 row after deleting 1 row");
				}
				var actual = section.rows[0].title;
				var expected = "row 0";
				if (actual !== expected) {
					callback_error("Expected remaining row to be '" + expected + "', but it is '" + actual + "'");
				}
				w.close();
				finish(testRun);
			}, 1000);
		});
		w.add(tv);
		w.open();
	}

	// https://jira.appcelerator.org/browse/TIMOB-8909
	this.childrenArrayEmpty = function(testRun) {
		var view = Ti.UI.createView();
		valueOf(testRun, view).shouldNotBeNull();
		valueOf(testRun, view).shouldBeObject();
		
		valueOf(testRun, view.children).shouldNotBeNull();
		valueOf(testRun, view.children).shouldNotBeUndefined();
		valueOf(testRun, view.children).shouldBeObject();
		valueOf(testRun, view.children).shouldBe(0);

		finish(testRun);
	}
}
