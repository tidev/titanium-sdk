var bootstrap = require("bootstrap");

exports.bootstrap = function(Titanium) {
	var Window = require("window").bootstrapWindow(Titanium);

	// Since Rhino doesn't use lazy bootstrap directly,
	// we need to just bite the bullet and assign these here
	Titanium.UI.Window = Window;
	Titanium.UI.createWindow = Window.createWindow;
	Titanium.invocationAPIs.push({namespace: "UI", api: "createWindow"});

	function iPhoneConstant(name) {
		Ti.API.error("!!!");
		Ti.API.error("!!! WARNING : Use of unsupported constant Ti.UI.iPhone." + name + " !!!");
		Ti.API.error("!!!");
		return 0;
	}

	// TODO: Remove me. Only for temporary compatibility
	Titanium.UI.iPhone = {
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
}
