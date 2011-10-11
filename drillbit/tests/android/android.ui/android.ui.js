/*global describe, Ti, Titanium */
describe("Ti.UI.Android tests", {
	androidUIAPIs: function() {
		valueOf(Ti.UI.Android).shouldNotBeNull();
		
		// constants
		valueOf(Ti.UI.Android.WEBVIEW_PLUGINS_OFF).shouldBeNumber();
		valueOf(Ti.UI.Android.WEBVIEW_PLUGINS_ON).shouldBeNumber();
		valueOf(Ti.UI.Android.WEBVIEW_PLUGINS_ON_DEMAND).shouldBeNumber();
	}, 
	testModuleNameCollision: function() {
		// Make sure both Ti.UI.Android and Ti.Android are properly accessible.
		// cf https://appcelerator.lighthouseapp.com/projects/32238/tickets/2000
		valueOf(Ti.UI.Android.SOFT_INPUT_ADJUST_PAN).shouldBe(32);
		valueOf(Ti.Android.ACTION_ALL_APPS).shouldBe('android.intent.action.ALL_APPS');
	},

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2340
	uniqueTagTableViewException: function() {
		var tableview = Ti.UI.createTableView({top:0});
		valueOf(tableview).shouldBeObject();
	},
	
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2343-android-crash-when-creating-tableview#ticket-2343-3
	noDataCrash: function() {
		var tableview = Ti.UI.createTableView({});
		valueOf(tableview).shouldBeObject();
	},

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2065-android-behavior-change-in-set-row-data-test-case#ticket-2065-5
	tableviewSetDataWithAnimationProps: function() {
		var w = Ti.UI.createWindow();
		w.open();
		var tv = Ti.UI.createTableView();
		w.add(tv);
		var data = [];
		for (var i = 0; i < 3; i++) {
			data.push( Ti.UI.createTableViewRow({title: 'test'}) );
		}
		tv.setData(data, {animationStyle:Titanium.UI.iPhone.RowAnimationStyle.NONE});
		valueOf(tv.data[0].rowCount).shouldBe(data.length);
		w.close();
	},
	
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2344-android-crash-when-hiding-switch#ticket-2344-3
	switchHasChildToggleCrash: asyncTest({
		start: function() {
			var w = Ti.UI.createWindow();
			var row = Ti.UI.createTableViewRow({ hasChild: true });
			row.add(Ti.UI.createLabel({text: "hello world"}));
			var data = [ row ];
			var tv = Ti.UI.createTableView({
				data: data
			});
			w.add(tv);
			w.open();
			
			var runAgain = true;
			var toggleEdit = this.async(function() {
				var row = tv.data[0].rowAtIndex(0);
				if (!row.button) {
					row.button = Ti.UI.createSwitch({
						visible: !row.hasChild,
						style: Ti.UI.Android.SWITCH_STYLE_CHECKBOX,
						right: -5
					});
				}
				row.hasChild = !row.hasChild;
				row.button.visible = !row.button.visible;
				if (runAgain) {
					runAgain = false;
					setTimeout(toggleEdit, 1000);
				} else {
					valueOf(row.hasChild).shouldBeTrue();
					valueOf(row.button.visible).shouldBeFalse();
				}
			});
			
			toggleEdit();
		},
		timeout: 10000,
		timeoutError: "Timed out drawing TableView"
	}),

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2146
	setDataReplacesExistingData: function() {
		var w = Ti.UI.createWindow();
		w.open();
		var tv = Ti.UI.createTableView({ data: [ Ti.UI.createTableViewRow({ title:'row'})]});
		w.add(tv);
		var data = [];
		for (var i = 0; i < 3; i++) {
			data.push( Ti.UI.createTableViewRow({title: 'test'}) );
		}
		tv.setData(data, {animationStyle:Titanium.UI.iPhone.RowAnimationStyle.NONE});
		valueOf(tv.data[0].rowCount).shouldBe(data.length);
		w.close();
	},

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1569-android-implement-image-cache
	// see 11/19/2010 comments from bill
	responseCacheRegression: function() {
		var w = Ti.UI.createWindow();
		w.open();
		var im = Ti.UI.createImageView( { image: 'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png', height:10, width: 10} );
		im.addEventListener('load', function() {w.close();});
		w.add(im);
	},

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2390-android-image-views-where-height-is-set-very-small-can-result-in-javalangarithmeticexception-divide-by-zero
	shortHeightImageView: function() {
		var w = Ti.UI.createWindow();
		w.open();
		var im = Ti.UI.createImageView( { image: 'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png', height:1, width: 1} );
		im.addEventListener('load', function() {w.close();});
		w.add(im);
	},

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2391-android-smoketest-map-view-test-crashes-on-load-with-illegalargumentexception#ticket-2391-3
	// this defect is no longer valid with https://appcelerator.lighthouseapp.com/projects/32238/tickets/1592-android-move-menu-to-tiandroidactivity an exception should be thrown now
	androidOptionMenuIllegalArgs: function() {
		valueOf( function() { Ti.UI.Android.OptionMenu.createMenu(); }).shouldThrowException();
	},

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2337-android-picker-setselectedrow-method-causes-exception-when-third-bool-argument-omitted#ticket-2337-4
	pickerSetSelectedRowCrash: function() {
		var w = Ti.UI.createWindow();
		w.open();
		var rows = [];
		rows.push(Ti.UI.createPickerRow({title: 'Row 0'}));
		rows.push(Ti.UI.createPickerRow({title: 'Row 1'}));
		var col = Ti.UI.createPickerColumn({rows: rows});
		var picker = Ti.UI.createPicker({columns: [col], left: 0, top: 0, width: 1, height: 1});
		w.add(picker);
		valueOf( function() {picker.setSelectedRow(0, 1);}).shouldNotThrowException();
	},

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/937
	removeMethodsAddRemoveView: function() {
		valueOf (Ti.UI.addView).shouldBeUndefined();
		valueOf (Ti.UI.removeView).shouldBeUndefined();
	},
	
	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2436
	addViewToEmptyScrollableView: function() {
		var scrollableView = Ti.UI.createScrollableView ();
		var view = Ti.UI.createView();
		
		scrollableView.addView (view);
	},

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2505
	lightweightWindowCrash: function() {
		valueOf( function() {Ti.UI.createWindow({url: 'lightweight.js'});}).shouldNotThrowException();
	},

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1787-android-tableviews-disappear-in-scrollableview
	tableViewDisappearInSV_as_async: function(callback) {
		var w = Ti.UI.createWindow();
		w.open();
		var views = [];
		for (var i = 0; i < 3; i++) {
			views.push(
				Ti.UI.createTableView({
					data: [ Ti.UI.createTableViewRow({title: 'Row for view ' + i}) ]
				})
			);
		}

		var sv = Ti.UI.createScrollableView({ views: views , top: 0, left: 0, right: 0, height: 5});
		w.add(sv);
		var moves = 0;
		var intervalId = -1;
		intervalId = setInterval(
			function(){
				if (moves ===0) {
					moves = moves + 1;
					sv.moveNext();
				} else if (moves === 1) {
					moves = moves + 1;
					sv.movePrevious();
				} else if (moves === 2) {
					moves = moves + 1;
					clearInterval(intervalId);
					var rows = sv.views[0].data.length;
					w.close();
					if (rows === 1) {
						callback.passed();
					}else {
						callback.failed("Expected 1 row after move, but there are " + rows);
					}
				}
		}, 2000);

	},

	//https://appcelerator.lighthouseapp.com/projects/32238/tickets/1829-android-tableview-doesnt-fire-scrollend
	tableViewFireScroll_as_async: function(callback) {
		var w = Ti.UI.createWindow();
		w.open();
		var data = [];
		for (var i = 0; i < 80; i++) {
			data.push(Ti.UI.createTableViewRow({title: 'row ' + i}));
		}
		var tv = Ti.UI.createTableView({data: data, top: 0, left: 0, right: 0, height: 100});
		var timeoutId;
		tv.addEventListener('scroll', function(e) {
			if (e.firstVisibleItem == 60) {
				clearTimeout(timeoutId);
				w.close();
				callback.passed();
			}
		});
		w.add(tv);
		setTimeout(function(){tv.scrollToIndex(60);},2000);
		timeoutId = setTimeout(function(){w.close(); callback.failed('Timed out waiting for scroll event');}, 5000);
	},
	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1827
	windowCloseMultiFire_as_async: function(callback) {
		var w = Ti.UI.createWindow();
		var closecount = 0;
		w.addEventListener('close', function() {
			closecount++;
		});
		w.open();
		var masterTimeout = setTimeout(function() {w.close(); callback.failed("Timed out waiting for test to complete.");}, 10000);
		setTimeout(function() {w.close();}, 2000);
		setTimeout(function() {
			clearTimeout(masterTimeout);
			if (closecount !== 1) {
				callback.failed('Expected close event to fire 1 time, but it fired ' + closecount + ' times');
			} else {
				callback.passed();
			}
		}, 4000);
	},
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2772
	scrollViewChildAutoWidthCrash: function() {
		var w = Ti.UI.createWindow();
		w.open();
		var sv = Ti.UI.createScrollView({
			contentWidth: 'auto',
			contentHeight: 'auto',
			height: 'auto',
			top: 0
		});

		var v = Ti.UI.createView({
			top: 0,
			height: 10
		});

		sv.add(v);
		w.add(sv);
		valueOf(true).shouldBeTrue();
		w.close();
	},
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/3039
	imageViewDpUnitCrash: function() {
		var w = Ti.UI.createWindow();
		w.open();
		w.add(Ti.UI.createImageView({
			image: 'KS_nav_ui.png',
			height: '5dp',
			width: '5dp'
		}));
	},
	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/3225-android-picker-custom-attributes
	pickerRowCustomAttr: function() {
		var row = Ti.UI.createPickerRow({title: 'blah', custom: 'blee'});
		valueOf(row.custom).shouldBe("blee");
	},
	// http://jira.appcelerator.org/browse/TIMOB-3862
	complexRowHeightCrash_as_async: function(callback) {
		var failureTimeout = null;
		var w = Ti.UI.createWindow();
		var tv = Ti.UI.createTableView({
			data: [ Ti.UI.createTableViewRow({title:'test', height: '50dp'}) ]
		});
		w.add( tv );
		w.addEventListener('open', function() {
			setTimeout(function(){
				var height = tv.size.height;
				if (failureTimeout !== null) {
					clearTimeout(failureTimeout);
				}
				callback.passed();
			}, 1000);
		});
		failureTimeout = setTimeout(function(){
			callback.failed("Test may have crashed app.  Was never able to read back tableview dimensions.");
		},10000);
		w.open();

	},
	pixelFormats : function() {
		valueOf(Ti.UI.Android.PIXEL_FORMAT_A_8).shouldBeNumber();
		valueOf(Ti.UI.Android.PIXEL_FORMAT_LA_88).shouldBeNumber();
		valueOf(Ti.UI.Android.PIXEL_FORMAT_L_8).shouldBeNumber();
		valueOf(Ti.UI.Android.PIXEL_FORMAT_OPAQUE).shouldBeNumber();
		valueOf(Ti.UI.Android.PIXEL_FORMAT_RGBA_4444).shouldBeNumber();
		valueOf(Ti.UI.Android.PIXEL_FORMAT_RGBA_5551).shouldBeNumber();
		valueOf(Ti.UI.Android.PIXEL_FORMAT_RGBA_8888).shouldBeNumber();
		valueOf(Ti.UI.Android.PIXEL_FORMAT_RGBX_8888).shouldBeNumber();
		valueOf(Ti.UI.Android.PIXEL_FORMAT_RGB_332).shouldBeNumber();
		valueOf(Ti.UI.Android.PIXEL_FORMAT_RGB_565).shouldBeNumber();
		valueOf(Ti.UI.Android.PIXEL_FORMAT_RGB_888).shouldBeNumber();
		valueOf(Ti.UI.Android.PIXEL_FORMAT_TRANSLUCENT).shouldBeNumber();
		valueOf(Ti.UI.Android.PIXEL_FORMAT_TRANSPARENT).shouldBeNumber();
		valueOf(Ti.UI.Android.PIXEL_FORMAT_UNKNOWN).shouldBeNumber();		
	},	
	webViewPluginMethods: function() {
		var wv = Ti.UI.createWebView();
		
		valueOf(wv).shouldNotBeNull();
		valueOf(wv.getPluginState).shouldBeFunction();
		valueOf(wv.setPluginState).shouldBeFunction();
		valueOf(wv.pause).shouldBeFunction();
		valueOf(wv.resume).shouldBeFunction();
		
		valueOf(wv.pluginState).shouldBe(Ti.UI.Android.WEBVIEW_PLUGINS_OFF);
		wv.pluginState = Ti.UI.Android.WEBVIEW_PLUGINS_ON;
		valueOf(wv.pluginState).shouldBe(Ti.UI.Android.WEBVIEW_PLUGINS_ON);
		wv.setPluginState(Ti.UI.Android.WEBVIEW_PLUGINS_ON_DEMAND);
		valueOf(wv.getPluginState()).shouldBe(Ti.UI.Android.WEBVIEW_PLUGINS_ON_DEMAND);
		
		wv = Ti.UI.createWebView({
			pluginState: Ti.UI.Android.WEBVIEW_PLUGINS_ON
		});
		valueOf(wv.pluginState).shouldBe(Ti.UI.Android.WEBVIEW_PLUGINS_ON);
		
		// set invalid state, should default to OFF
		wv.pluginState = 5;
		valueOf(wv.pluginState).shouldBe(Ti.UI.Android.WEBVIEW_PLUGINS_OFF);
	},
	webViewEnableZoomControlsMethods: function() {
		var wv = Ti.UI.createWebView();
		
		valueOf(wv).shouldNotBeNull();
		valueOf(wv.getEnableZoomControls).shouldBeFunction();
		valueOf(wv.setEnableZoomControls).shouldBeFunction();
		
		valueOf(wv.enableZoomControls).shouldBeTrue();
		wv.enableZoomControls = false;
		valueOf(wv.enableZoomControls).shouldBeFalse();
		wv.setEnableZoomControls(true);
		valueOf(wv.getEnableZoomControls()).shouldBeTrue();
		
		wv = Ti.UI.createWebView({
			enableZoomControls: false
		});
		valueOf(wv.enableZoomControls).shouldBeFalse();
		
	},
	keepScreenOn: function() {
		var v = Ti.UI.createView();
		valueOf(v).shouldNotBeNull();
		valueOf(v.getKeepScreenOn).shouldBeFunction();
		valueOf(v.setKeepScreenOn).shouldBeFunction();

		v.keepScreenOn = true;
		valueOf(v.keepScreenOn).shouldBeTrue();
		valueOf(v.getKeepScreenOn()).shouldBeTrue();
		v.keepScreenOn = false;
		valueOf(v.keepScreenOn).shouldBeFalse();
		valueOf(v.getKeepScreenOn()).shouldBeFalse();

		v.setKeepScreenOn(false);
		valueOf(v.keepScreenOn).shouldBeFalse();
		valueOf(v.getKeepScreenOn()).shouldBeFalse();
		v.setKeepScreenOn(true);
		valueOf(v.keepScreenOn).shouldBeTrue();
		valueOf(v.getKeepScreenOn()).shouldBeTrue();
	}
})

