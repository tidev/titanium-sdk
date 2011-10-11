var bootstrap = require("bootstrap");

exports.bootstrap = function(Titanium){
	var Window;
	bootstrap.defineLazyGetter("UI", "Window", function() {
		if (!Window) {
			Window = require("window").bootstrapWindow(Titanium);
		}
		return Window;
	});

	bootstrap.defineLazyGetter("UI", "createWindow", function() {
		if (!Window) {
			Window = require("window").bootstrapWindow(Titanium);
		}
		return Window.createWindow;
	});

	function iPhoneConstant(name) {
		Ti.API.error("!!!");
		Ti.API.error("!!! WARNING : Use of unsupported constant Ti.UI.iPhone." + name + " !!!");
		Ti.API.error("!!!");
		return 0;
	}

	var iPhone = {
		ActivityIndicatorStyle: {
			get BIG() { return iPhoneConstant("ActivityIndicatorStyle.BIG"); },
			get DARK() { return  iPhoneConstant("ActivityIndicatorStyle.DARK"); }
		},
		SystemButtonStyle: {
			get BAR() { return iPhoneConstant("SystemButtonStyle.BAR"); }
		},
		TableViewCellSelectionStyle: {
			get NONE() { return iPhoneConstant("TableViewCellSelectionStyle.NONE"); }
		},
		TableViewSeparatorStyle: {
			get NONE() { return iPhoneConstant("TableViewSeparatorStyle.NONE"); }
		}
	};

	bootstrap.defineLazyGetter("UI", "iPhone", function() {
		return iPhone;
	})
}