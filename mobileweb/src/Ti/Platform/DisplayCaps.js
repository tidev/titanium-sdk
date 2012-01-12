define("Ti/Platform/DisplayCaps", ["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {
	
	// Pre-calculate the screen DPI
	var body = document.body,
		measureDiv = document.createElement('div');
	measureDiv.style.width = "1in";
	measureDiv.style.visibility = "hidden";
	body.appendChild(measureDiv);
	var dpi = parseInt(measureDiv.clientWidth);
	body.removeChild(measureDiv);
	
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

				dpi: dpi,

				platformHeight: window.innerHeight,

				platformWidth: window.innerWidth
			}
	
		});

	return Ti.Platform.displayCaps = api;

});