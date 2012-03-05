define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var api = {};

	require.each(["debug", "error", "info", "log", "warn"], function(fn) {
		api[fn] = function() {
			console[fn]("[" + fn.toUpperCase() + "] " + lang.toArray(arguments).map(function(a) {
				return require.is(a, "Object") ? a.toString ? a.toString() : JSON.stringify(a) : a || "null";
			}).join(' '));
		};
	});

	return lang.setObject("Ti.API", Evented, api);

});