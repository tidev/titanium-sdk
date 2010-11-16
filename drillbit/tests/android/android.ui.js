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
	}
		
})
