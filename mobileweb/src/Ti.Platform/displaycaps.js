(function(api){

	Ti.Platform.displayCaps = api;

	// Properties
	Ti._5.propReadOnly(api, {
		density: function(){
			switch (navigator.userAgent.toLowerCase()) {
				case "iphone":
					return "medium";
				case "ipad":
					return "medium";
				default:
					return "";
			}
		},
		dpi: function(){
			switch (navigator.userAgent.toLowerCase()) {
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
	});

})(Ti._5.createClass("Ti.Platform.DisplayCaps"));