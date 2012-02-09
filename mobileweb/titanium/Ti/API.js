define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var api = {};

	require.each(["debug", "error", "info", "log", "warn"], function(fn) {
		api[fn] = function(msg) {
			console[fn]("[" + fn.toUpperCase() + "]", msg);
		};
	});

	return lang.setObject("Ti.API", Evented, api);

});