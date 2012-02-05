define("Ti/Platform/DisplayCaps", ["Ti/_", "Ti/_/Evented", "Ti/_/lang"], function(_, Evented, lang) {

	var ua = navigator.userAgent.toLowerCase();

	return Ti.Platform.displayCaps = lang.setObject("Ti.Platform.DisplayCaps", Evented, {

		constants: {
			density: function(){
				switch (ua) {
					case "iphone":
						return "medium";
					case "ipad":
						return "medium";
					default:
						return "";
				}
			},

			dpi: _.dpi,

			platformHeight: window.innerHeight,

			platformWidth: window.innerWidth
		}

	});

});