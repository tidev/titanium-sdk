/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var TAG = "invoker";

/**
 * Generates a wrapped invoker function for a specific API
 * This lets us pass in context-specific data to a function
 * defined in an API namespace (i.e. on a module)
 *
 * We use this for create methods, and other APIs that take
 * a KrollInvocation object as their first argument in Java
 *
 * For example, an invoker for a "create" method might look
 * something like this:
 *
 *     function createView(sourceUrl, options) {
 *         var view = new View(options);
 *         view.sourceUrl = sourceUrl;
 *         return view;
 *     }
 *
 * And the corresponding invoker for app.js would look like:
 *
 *     UI.createView = function() {
 *         return createView("app://app.js", arguments[0]);
 *     }
 *
 * wrapperAPI: The scope specific API (module) wrapper
 * realAPI: The actual module implementation
 * apiName: The top level API name of the root module
 * invocationAPI: The actual API to generate an invoker for
 * scopeVars: A map that is passed into each invoker
 */

function genInvoker(wrapperAPI, realAPI, apiName, invocationAPI, scopeVars) {
	var namespace = invocationAPI.namespace;
	var names = namespace.split(".");
	var length = names.length;
	if (namespace === apiName) {
		length = 0;
	}

	var apiNamespace = wrapperAPI;

	for (var j = 0, namesLen = length; j < namesLen; ++j) {
		var name = names[j];
		var api;

		// Create a module wrapper only if it hasn't been wrapped already.
		if (apiNamespace.hasOwnProperty(name)) {
			api = apiNamespace[name];

		} else {
			function SandboxAPI() {
				var proto = this.__proto__;
				Object.defineProperty(this, '_events', {
					get: function() {
						return proto._events;
					},
					set: function(value) {
						proto._events = value;
					}
				});
			}
			SandboxAPI.prototype = apiNamespace[name];

			api = new SandboxAPI();
			apiNamespace[name] = api;
		}

		apiNamespace = api;
		realAPI = realAPI[name];
	}

	var delegate = realAPI[invocationAPI.api];

	// These invokers form a call hierarchy so we need to
	// provide a way back to the actual root Titanium / actual impl.
	while (delegate.__delegate__) {
		delegate = delegate.__delegate__;
	}

	apiNamespace[invocationAPI.api] = createInvoker(realAPI, delegate, scopeVars);
}
exports.genInvoker = genInvoker;

/**
 * Creates and returns a single invoker function that wraps
 * a delegate function, thisObj, and scopeVars
 */
function createInvoker(thisObj, delegate, scopeVars) {
	var urlInvoker = function invoker() {
		var args = Array.prototype.slice.call(arguments);
		args.splice(0, 0, invoker.__scopeVars__);

		return delegate.apply(invoker.__thisObj__, args);
	}

	urlInvoker.__delegate__ = delegate;
	urlInvoker.__thisObj__ = thisObj;
	urlInvoker.__scopeVars__ = scopeVars;

	return urlInvoker;
}
exports.createInvoker = createInvoker;
