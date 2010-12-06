/*global describe, Ti, Titanium */
describe("Ti.UI.Android tests", {
	androidUIAPIs: function() {
		valueOf(Ti.UI.Android).shouldNotBeNull();
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
	}

})

