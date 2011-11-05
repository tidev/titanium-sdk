var bootstrap = require("bootstrap");

exports.bootstrap = function(Titanium) {
	var Window = require("window").bootstrapWindow(Titanium);
	require("tab").bootstrap(Titanium);

	// Since Rhino doesn't use lazy bootstrap directly,
	// we need to just bite the bullet and assign these here
	Titanium.UI.Window = Window;
	Titanium.UI.createWindow = Window.createWindow;
	Titanium.invocationAPIs.push({namespace: "UI", api: "createWindow"});

	function iPhoneConstant(name) {
		Titanium.API.error("!!!");
		Titanium.API.error("!!! WARNING : Use of unsupported constant Ti.UI.iPhone." + name + " !!!");
		Titanium.API.error("!!!");
		return 0;
	}

	// TODO: Remove me. Only for temporary compatibility
	Titanium.UI.iPhone = {
		ActivityIndicatorStyle: {
			get BIG() { return iPhoneConstant("ActivityIndicatorStyle.BIG"); },
			get DARK() { return  iPhoneConstant("ActivityIndicatorStyle.DARK"); }
		},
		AnimationStyle: {
			get FLIP_FROM_LEFT() { return iPhoneConstant("AnimationStyle.FLIP_FROM_LEFT"); }
		},
		ProgressBarStyle: {
			get SIMPLE() { return iPhoneConstant("ProgressBarStyle.SIMPLE"); }
		},
		SystemButton: {
			get FLEXIBLE_SPACE() { return iPhoneConstant("SystemButton.FLEXIBLE_SPACE"); }
		},
		SystemButtonStyle: {
			get BAR() { return iPhoneConstant("SystemButtonStyle.BAR"); }
		},
		TableViewCellSelectionStyle: {
			get NONE() { return iPhoneConstant("TableViewCellSelectionStyle.NONE"); }
		},
		TableViewSeparatorStyle: {
			get NONE() { return iPhoneConstant("TableViewSeparatorStyle.NONE"); }
		},
		RowAnimationStyle: {
			get NONE() { return iPhoneConstant("RowAnimationStyle.NONE"); }
		}
	};

	var TiView = Titanium.TiView;
	TiView.prototype.toJSON = function() {
		var json = {};
		var keys = Object.keys(this);
		var len = keys.length;

		for (var i = 0; i < len; i++) {
			var key = keys[i];
			if (key == "parent") {
				continue;
			}
			json[key] = this[key];
		}
		return json;
	}

	// Define constants for ActivityIndicator here for now.
	Titanium.UI.ActivityIndicator.STATUS_BAR = 0;
	Titanium.UI.ActivityIndicator.DIALOG = 1;
	Titanium.UI.ActivityIndicator.INDETERMINANT = 0;
	Titanium.UI.ActivityIndicator.DETERMINANT = 1;
}
