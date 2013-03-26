/**
 * ready() functionality based on code from Dojo Toolkit.
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 */

define(function() {
	var doc = document,
		on = require.on,
		readyStates = { "loaded": 1, "complete": 1 },
		isReady = !!readyStates[doc.readyState],
		readyQ = [];

	if (!isReady) {
		function detectReady(evt) {
			if (isReady || (evt && evt.type == "readystatechange" && !readyStates[doc.readyState])) {
				return;
			}
			while (readyQ.length) {
				(readyQ.shift())();
			}
			isReady = 1;
		}

		readyQ.concat([
			on(doc, "DOMContentLoaded", detectReady),
			on(window, "load", detectReady)
		]);

		if ("onreadystatechange" in doc) {
			readyQ.push(require.on(doc, "readystatechange", detectReady));
		} else {
			function poller() {
				readyStates[doc.readyState] ? detectReady() : setTimeout(poller, 30);
			}
			poller();
		}
	}

	function ready(priority, context, callback) {
		var fn, i, l;
		if (!require.is(priority, "Number")) {
			callback = context;
			context = priority;
			priority = 1000;
		}
		fn = callback ? function(){ callback.call(context); } : context;
		if (isReady) {
			fn();
		} else {
			fn.priority = priority;
			for (i = 0, l = readyQ.length; i < l && priority >= readyQ[i].priority; i++) {}
			readyQ.splice(i, 0, fn);
		}
	}

	ready.load = function(name, require, onLoad) {
		ready(onLoad);
	};

	return ready;
});