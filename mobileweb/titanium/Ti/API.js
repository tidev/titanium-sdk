/*global define, window*/
define(['Ti/_/Evented', 'Ti/_/lang'], function(Evented, lang) {

	var api = {},
		global = window,
		con = global.console,
		i = 0,
		last,

		// the order of these DOES matter... it uses the last known function
		// (i.e. if trace() does not exist, it'll use debug() for trace)
		fns = ['debug', 'trace', 'error', 'fatal', 'critical', 'notice', 'warn', 'info'],
		len = fns.length;

	// console.*() shim
	con === void 0 && (con = global.console = {});

	// make sure 'log' is always at the end
	fns.forEach(function(c) {
		con[c] || (con[c] = ('log' in con) ? function () {
				var a = Array.apply({}, arguments);
				a.unshift(c + ':');
				con.log(a.join(' '));
			} : function () {}
		);
	});

	con.trace = 0; // need to undefine trace() since it does something completely different

	for (; i < len; i++) {
		(function(fn) {
			var ls = last = console[fn] ? fn : last;
			api[fn] = function() {
				console[ls]('[' + fn.toUpperCase() + '] ' + lang.toArray(arguments).map(function(a) {
					return require.is(a, 'Object') ? a.hasOwnProperty('toString') ? a.toString() : JSON.stringify(a) : a === null ? 'null' : a === void 0 ? 'undefined' : a;
				}).join(' '));
			};
		})(fns[i]);
	}

	api.log = function () {
		var a = lang.toArray(arguments);
		var fn = ~fns.indexOf(('' + a[0]).toLowerCase()) && a.shift().toLowerCase();
		api[fn||'info'].apply(this, a);
	};

	return lang.setObject('Ti.API', Evented, api);

});