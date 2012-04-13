define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var api = {};

	require.each(["debug", "error", "info", "log", "warn"], function(fn) {
		api[fn] = function() {
			if (!!window.console) {
				var message = "[" + fn.toUpperCase() + "] " + lang.toArray(arguments).map(function(a) {
						return require.is(a, "Object") ? a.hasOwnProperty("toString") ? a.toString() : JSON.stringify(a) : a === null ? "null" : a === void 0 ? "undefined" : a;
					}).join(' ');
				fn in console ? console[fn](message) : console.log(message);
			}
		};
	});

	return lang.setObject("Ti.API", Evented, api);

});