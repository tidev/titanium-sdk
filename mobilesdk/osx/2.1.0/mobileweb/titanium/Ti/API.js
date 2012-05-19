define(["Ti/_/Evented", "Ti/_/lang"], function(Evented, lang) {

	var api = {},
		i = 0,
		last,
		fns = ["debug", "trace", "error", "fatal", "critical", "info", "notice", "log", "warn"];

	console.trace = 0; // need to undefine trace() since it does something completely different

	for (; i < 9; i++) {
		(function(fn) {
			var ls = last = console[fn] ? fn : last;
			api[fn] = function() {
				console[ls]("[" + fn.toUpperCase() + "] " + lang.toArray(arguments).map(function(a) {
					return require.is(a, "Object") ? a.hasOwnProperty("toString") ? a.toString() : JSON.stringify(a) : a === null ? "null" : a === void 0 ? "undefined" : a;
				}).join(' '));
			};
		})(fns[i]);
	}

	return lang.setObject("Ti.API", Evented, api);

});