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

	this.name = "android_ui";
	this.tests = [
		{name: "androidUIAPIs"},
		{name: "testModuleNameCollision"},
		{name: "uniqueTagTableViewException"},
		{name: "noDataCrash"},
		{name: "tableviewSetDataWithAnimationProps"},
		{name: "switchHasChildToggleCrash", timeout: 10000},
		{name: "setDataReplacesExistingData"},
		{name: "responseCacheRegression"},
		{name: "shortHeightImageView"},
		{name: "androidOptionMenuIllegalArgs"},
		{name: "pickerSetSelectedRowCrash"},
		{name: "removeMethodsAddRemoveView"},
		{name: "addViewToEmptyScrollableView"},
		{name: "lightweightWindowCrash"},
		{name: "tableViewDisappearInSV"},
		{name: "tableViewFireScroll"},
		{name: "windowCloseMultiFire"},
		{name: "scrollViewChildAutoWidthCrash"},
		{name: "imageViewDpUnitCrash"},
		{name: "pickerRowCustomAttr"},
		{name: "complexRowHeightCrash"},
		{name: "pixelFormats"},
		{name: "webViewPluginMethods"},
		{name: "webViewEnableZoomControlsMethods"},
		{name: "keepScreenOn"},
		{name: "webViewUserAgentMethods"}
	]

	this.androidUIAPIs = function(testRun) {
		valueOf(testRun, Ti.UI.Android).shouldNotBeNull();
		
		// constants
		valueOf(testRun, Ti.UI.Android.WEBVIEW_PLUGINS_OFF).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.WEBVIEW_PLUGINS_ON).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.WEBVIEW_PLUGINS_ON_DEMAND).shouldBeNumber();

		finish(testRun);
	}

	this.testModuleNameCollision = function(testRun) {
		// Make sure both Ti.UI.Android and Ti.Android are properly accessible.
		// cf https://appcelerator.lighthouseapp.com/projects/32238/tickets/2000
		valueOf(testRun, Ti.UI.Android.SOFT_INPUT_ADJUST_PAN).shouldBe(32);
		valueOf(testRun, Ti.Android.ACTION_ALL_APPS).shouldBe('android.intent.action.ALL_APPS');

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2340
	this.uniqueTagTableViewException = function(testRun) {
		var tableview = Ti.UI.createTableView({top:0});
		valueOf(testRun, tableview).shouldBeObject();

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2343-android-crash-when-creating-tableview#ticket-2343-3
	this.noDataCrash = function(testRun) {
		var tableview = Ti.UI.createTableView({});
		valueOf(testRun, tableview).shouldBeObject();

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2065-android-behavior-change-in-set-row-data-test-case#ticket-2065-5
	this.tableviewSetDataWithAnimationProps = function(testRun) {
		var w = Ti.UI.createWindow();
		w.open();
		var tv = Ti.UI.createTableView();
		w.add(tv);
		var data = [];
		for (var i = 0; i < 3; i++) {
			data.push( Ti.UI.createTableViewRow({title: 'test'}) );
		}
		tv.setData(data, {animationStyle:Titanium.UI.iPhone.RowAnimationStyle.NONE});
		valueOf(testRun, tv.data[0].rowCount).shouldBe(data.length);
		w.close();

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2344-android-crash-when-hiding-switch#ticket-2344-3
	this.switchHasChildToggleCrash = function(testRun) {
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
		var toggleEdit = function() {
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
				valueOf(testRun, row.hasChild).shouldBeTrue();
				valueOf(testRun, row.button.visible).shouldBeFalse();

				finish(testRun);
			}
		};

		toggleEdit();
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2146
	this.setDataReplacesExistingData = function(testRun) {
		var w = Ti.UI.createWindow();
		w.open();
		var tv = Ti.UI.createTableView({ data: [ Ti.UI.createTableViewRow({ title:'row'})]});
		w.add(tv);
		var data = [];
		for (var i = 0; i < 3; i++) {
			data.push( Ti.UI.createTableViewRow({title: 'test'}) );
		}
		tv.setData(data, {animationStyle:Titanium.UI.iPhone.RowAnimationStyle.NONE});
		valueOf(testRun, tv.data[0].rowCount).shouldBe(data.length);
		w.close();

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1569-android-implement-image-cache
	// see 11/19/2010 comments from bill
	this.responseCacheRegression = function(testRun) {
		var w = Ti.UI.createWindow();
		w.open();
		var im = Ti.UI.createImageView( { image: 'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png', height:10, width: 10} );
		im.addEventListener('load', function() {w.close();});
		w.add(im);

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2390-android-image-views-where-height-is-set-very-small-can-result-in-javalangarithmeticexception-divide-by-zero
	this.shortHeightImageView = function(testRun) {
		var w = Ti.UI.createWindow();
		w.open();
		var im = Ti.UI.createImageView( { image: 'http://www.appcelerator.com/wp-content/uploads/2009/06/titanium_desk.png', height:1, width: 1} );
		im.addEventListener('load', function() {w.close();});
		w.add(im);

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2391-android-smoketest-map-view-test-crashes-on-load-with-illegalargumentexception#ticket-2391-3
	// this defect is no longer valid with https://appcelerator.lighthouseapp.com/projects/32238/tickets/1592-android-move-menu-to-tiandroidactivity an exception should be thrown now
	this.androidOptionMenuIllegalArgs = function(testRun) {
		valueOf(testRun,  function() { Ti.UI.Android.OptionMenu.createMenu(); }).shouldThrowException();

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2337-android-picker-setselectedrow-method-causes-exception-when-third-bool-argument-omitted#ticket-2337-4
	this.pickerSetSelectedRowCrash = function(testRun) {
		var w = Ti.UI.createWindow();
		w.open();
		var rows = [];
		rows.push(Ti.UI.createPickerRow({title: 'Row 0'}));
		rows.push(Ti.UI.createPickerRow({title: 'Row 1'}));
		var col = Ti.UI.createPickerColumn({rows: rows});
		var picker = Ti.UI.createPicker({columns: [col], left: 0, top: 0, width: 1, height: 1});
		w.add(picker);
		valueOf(testRun,  function() {picker.setSelectedRow(0, 1);}).shouldNotThrowException();

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/937
	this.removeMethodsAddRemoveView = function(testRun) {
		valueOf (testRun, Ti.UI.addView).shouldBeUndefined();
		valueOf (testRun, Ti.UI.removeView).shouldBeUndefined();

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2436
	this.addViewToEmptyScrollableView = function(testRun) {
		var scrollableView = Ti.UI.createScrollableView ();
		var view = Ti.UI.createView();
		
		scrollableView.addView (view);

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2505
	this.lightweightWindowCrash = function(testRun) {
		valueOf(testRun,  function() {Ti.UI.createWindow({url: 'lightweight.js'});}).shouldNotThrowException();

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1787-android-tableviews-disappear-in-scrollableview
	this.tableViewDisappearInSV = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
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
						finish(testRun);
					}else {
						callback_error("Expected 1 row after move, but there are " + rows);
					}
				}
		}, 2000);
	}

	//https://appcelerator.lighthouseapp.com/projects/32238/tickets/1829-android-tableview-doesnt-fire-scrollend
	this.tableViewFireScroll = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
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
				finish(testRun);
			}
		});
		w.add(tv);
		setTimeout(function(){tv.scrollToIndex(60);},2000);
		timeoutId = setTimeout(function(){w.close(); callback_error('Timed out waiting for scroll event');}, 5000);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1827
	this.windowCloseMultiFire = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var w = Ti.UI.createWindow();
		var closecount = 0;
		w.addEventListener('close', function() {
			closecount++;
		});
		w.open();
		var masterTimeout = setTimeout(function() {w.close(); callback_error("Timed out waiting for test to complete.");}, 10000);
		setTimeout(function() {w.close();}, 2000);
		setTimeout(function() {
			clearTimeout(masterTimeout);
			if (closecount !== 1) {
				callback_error('Expected close event to fire 1 time, but it fired ' + closecount + ' times');
			} else {
				finish(testRun);
			}
		}, 4000);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2772
	this.scrollViewChildAutoWidthCrash = function(testRun) {
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
		valueOf(testRun, true).shouldBeTrue();
		w.close();

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/3039
	this.imageViewDpUnitCrash = function(testRun) {
		var w = Ti.UI.createWindow();
		w.open();
		w.add(Ti.UI.createImageView({
			image: 'KS_nav_ui.png',
			height: '5dp',
			width: '5dp'
		}));

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/3225-android-picker-custom-attributes
	this.pickerRowCustomAttr = function(testRun) {
		var row = Ti.UI.createPickerRow({title: 'blah', custom: 'blee'});
		valueOf(testRun, row.custom).shouldBe("blee");

		finish(testRun);
	}

	// http://jira.appcelerator.org/browse/TIMOB-3862
	this.complexRowHeightCrash = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
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
				finish(testRun);
			}, 1000);
		});
		failureTimeout = setTimeout(function(){
			callback_error("Test may have crashed app.  Was never able to read back tableview dimensions.");
		},10000);
		w.open();
	}

	this.pixelFormats = function(testRun) {
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_A_8).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_LA_88).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_L_8).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_OPAQUE).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_RGBA_4444).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_RGBA_5551).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_RGBA_8888).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_RGBX_8888).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_RGB_332).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_RGB_565).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_RGB_888).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_TRANSLUCENT).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_TRANSPARENT).shouldBeNumber();
		valueOf(testRun, Ti.UI.Android.PIXEL_FORMAT_UNKNOWN).shouldBeNumber();

		finish(testRun);
	}

	this.webViewPluginMethods = function(testRun) {
		var wv = Ti.UI.createWebView();
		
		valueOf(testRun, wv).shouldNotBeNull();
		valueOf(testRun, wv.getPluginState).shouldBeFunction();
		valueOf(testRun, wv.setPluginState).shouldBeFunction();
		valueOf(testRun, wv.pause).shouldBeFunction();
		valueOf(testRun, wv.resume).shouldBeFunction();
		
		valueOf(testRun, wv.pluginState).shouldBe(Ti.UI.Android.WEBVIEW_PLUGINS_OFF);
		wv.pluginState = Ti.UI.Android.WEBVIEW_PLUGINS_ON;
		valueOf(testRun, wv.pluginState).shouldBe(Ti.UI.Android.WEBVIEW_PLUGINS_ON);
		wv.setPluginState(Ti.UI.Android.WEBVIEW_PLUGINS_ON_DEMAND);
		valueOf(testRun, wv.getPluginState()).shouldBe(Ti.UI.Android.WEBVIEW_PLUGINS_ON_DEMAND);
		
		wv = Ti.UI.createWebView({
			pluginState: Ti.UI.Android.WEBVIEW_PLUGINS_ON
		});
		valueOf(testRun, wv.pluginState).shouldBe(Ti.UI.Android.WEBVIEW_PLUGINS_ON);
		
		// set invalid state, should default to OFF
		wv.pluginState = 5;
		valueOf(testRun, wv.pluginState).shouldBe(Ti.UI.Android.WEBVIEW_PLUGINS_OFF);

		finish(testRun);
	}

	this.webViewEnableZoomControlsMethods = function(testRun) {
		var wv = Ti.UI.createWebView();
		
		valueOf(testRun, wv).shouldNotBeNull();
		valueOf(testRun, wv.getEnableZoomControls).shouldBeFunction();
		valueOf(testRun, wv.setEnableZoomControls).shouldBeFunction();
		
		valueOf(testRun, wv.enableZoomControls).shouldBeTrue();
		wv.enableZoomControls = false;
		valueOf(testRun, wv.enableZoomControls).shouldBeFalse();
		wv.setEnableZoomControls(true);
		valueOf(testRun, wv.getEnableZoomControls()).shouldBeTrue();
		
		wv = Ti.UI.createWebView({
			enableZoomControls: false
		});
		valueOf(testRun, wv.enableZoomControls).shouldBeFalse();

		finish(testRun);
	}

	this.keepScreenOn = function(testRun) {
		var v = Ti.UI.createView();
		valueOf(testRun, v).shouldNotBeNull();
		valueOf(testRun, v.getKeepScreenOn).shouldBeFunction();
		valueOf(testRun, v.setKeepScreenOn).shouldBeFunction();

		v.keepScreenOn = true;
		valueOf(testRun, v.keepScreenOn).shouldBeTrue();
		valueOf(testRun, v.getKeepScreenOn()).shouldBeTrue();
		v.keepScreenOn = false;
		valueOf(testRun, v.keepScreenOn).shouldBeFalse();
		valueOf(testRun, v.getKeepScreenOn()).shouldBeFalse();

		v.setKeepScreenOn(false);
		valueOf(testRun, v.keepScreenOn).shouldBeFalse();
		valueOf(testRun, v.getKeepScreenOn()).shouldBeFalse();
		v.setKeepScreenOn(true);
		valueOf(testRun, v.keepScreenOn).shouldBeTrue();
		valueOf(testRun, v.getKeepScreenOn()).shouldBeTrue();

		finish(testRun);
	}

	//Test Cases for timob-1055
	this.webViewUserAgentMethods = function(testRun) {
		var wv = Ti.UI.createWebView();
    	
    	valueOf(testRun, wv.getUserAgent()).shouldNotBeNull();
    	valueOf(testRun, wv.userAgent).shouldNotBeNull();
    	wv.setUserAgent("custom");
    	valueOf(testRun, wv.getUserAgent()).shouldBe("custom");
    	wv.userAgent = "custom2";
    	valueOf(testRun, wv.userAgent).shouldBe("custom2");

		finish(testRun);
	}
}
