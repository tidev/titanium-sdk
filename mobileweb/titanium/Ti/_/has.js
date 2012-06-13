define(function() {

	var cfg = require.config,
		hasCache = cfg.hasCache || {},
		global = window,
		doc = global.document,
		el = doc.createElement("div"),
		i;

	function has(name) {
		// summary:
		//		Determines of a specific feature is supported.
		//
		// name: String
		//		The name of the test.
		//
		// returns: Boolean (truthy/falsey)
		//		Whether or not the feature has been detected.

		var fn = hasCache[name];
		require.is(fn, "Function") && (fn = hasCache[name] = fn(global, doc, el));
		return fn;
	}

	has.add = function hasAdd(name, test, now, force){
		// summary:
		//		Adds a feature test.
		//
		// name: String
		//		The name of the test.
		//
		// test: Function
		//		The function that tests for a feature.
		//
		// now: Boolean?
		//		If true, runs the test immediately.
		//
		// force: Boolean?
		//		If true, forces the test to override an existing test.

		if (hasCache[name] === void 0 || force) {
			hasCache[name] = test;
		}
		return now && has(name);
	};

	// run all feature detection tests
	for (i in cfg.has) {
		has.add(i, cfg.has[i], 0, true);
	}
	delete cfg.has;

	return has;

});
