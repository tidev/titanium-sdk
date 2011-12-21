define("Ti/Platform/DisplayCaps", ["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var ua = navigator.userAgent.toLowerCase(),
		api = lang.setObject("Ti.Platform.DisplayCaps", Evented, {

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

				dpi: function(){
					switch (ua) {
						case "iphone":
							return 160;
						case "ipad":
							return 130;
						default:
							return 0;
					}
				},

				platformHeight: window.innerHeight,

				platformWidth: window.innerWidth
			}
	
		});

	return Ti.Platform.displayCaps = api;

});