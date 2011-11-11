(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Methods
	api.debug = function(msg) {
		console.debug("[DEBUG] " + msg);
	};

	api.error = function(msg) {
		console.error("[ERROR] " + msg);
	};

	api.info = function(msg) {
		console.info("[INFO] " + msg);
	};	

	api.log = function(msg) {
		console.log("[LOG] " + msg);
	};

	api.warn = function(msg) {
		console.warn("[WARN] " + msg);
	};
})(Ti._5.createClass('Titanium.API'));