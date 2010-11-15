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
