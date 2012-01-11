(function(api){
	// Interfaces
	Ti._5.EventDriven(api);

	// Methods
	require.each(["debug", "error", "info", "log", "warn"], function(fn) {
		api[fn] = function(msg) {
			console[fn]("[" + fn.toUpperCase() + "] " + msg);
		};
	});

})(Ti._5.createClass('Ti.API'));