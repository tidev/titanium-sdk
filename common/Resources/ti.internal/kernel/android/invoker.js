/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

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

/**
 * @param {object} wrapperAPI e.g. TitaniumWrapper
 * @param {object} realAPI e.g. Titanium
 * @param {string} apiName e.g. 'Titanium'
 * @param {object} invocationAPI details on the api we're wrapping
 * @param {string} invocationAPI.namespace the namespace of the proxy where method hangs (w/o 'Ti.' prefix) e.g. 'Filesystem' or 'UI.Android'
 * @param {string} invocationAPI.api the method name e.g. 'openFile' or 'createSearchView'
 * @param {object} scopeVars holder for context specific values (basically just wraps sourceUrl)
 * @param {string} scopeVars.sourceUrl source URL of js file entry point
 * @param {Module} [scopeVars.module] module
 */
function genInvoker(wrapperAPI, realAPI, apiName, invocationAPI, scopeVars) {
	let apiNamespace = wrapperAPI;
	const namespace = invocationAPI.namespace;
	if (namespace !== apiName) {
		const names = namespace.split('.');
		for (const name of names) {
			let api;
			// Create a module wrapper only if it hasn't been wrapped already.
			if (Object.prototype.hasOwnProperty.call(apiNamespace, name)) {
				api = apiNamespace[name];
			} else {
				function SandboxAPI() {
					const proto = Object.getPrototypeOf(this);
					Object.defineProperty(this, '_events', {
						get: function () {
							return proto._events;
						},
						set: function (value) {
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
	}

	let delegate = realAPI[invocationAPI.api];
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
 * @param {object} thisObj The `this` object to use when invoking the `delegate` function
 * @param {function} delegate The function to wrap/delegate to under the hood
 * @param {object} scopeVars The scope variables to splice into the arguments when calling the delegate
 * @param {string} scopeVars.sourceUrl the only real relevent scope variable!
 * @return {function}
 */
function createInvoker(thisObj, delegate, scopeVars) {
	const urlInvoker = function invoker(...args) { // eslint-disable-line func-style
		args.splice(0, 0, invoker.__scopeVars__);

		return delegate.apply(invoker.__thisObj__, args);
	};

	urlInvoker.__delegate__ = delegate;
	urlInvoker.__thisObj__ = thisObj;
	urlInvoker.__scopeVars__ = scopeVars;

	return urlInvoker;
}
exports.createInvoker = createInvoker;
