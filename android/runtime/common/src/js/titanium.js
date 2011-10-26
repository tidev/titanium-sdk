/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var tiBinding = kroll.binding('Titanium'),
	Titanium = tiBinding.Titanium,
	Proxy = tiBinding.Proxy,
	assets = kroll.binding('assets'),
	Script = kroll.binding('evals').Script,
	bootstrap = require('bootstrap'),
	path = require('path'),
	url = require('url');

var TAG = "Titanium";

// the app entry point
Titanium.sourceUrl = "app://app.js";

// a list of java APIs that need an invocation-specific URL
// passed in as the first argument
Titanium.invocationAPIs = [];

function TiInclude(filename, baseUrl, currentWindow) {
	baseUrl = typeof(baseUrl) === 'undefined' ? "app://app.js" : baseUrl;
	var sourceUrl = url.resolve(baseUrl, filename);
	var source;

	if (kroll.runtime == 'rhino') {
		var path = filename;

		if (sourceUrl.assetPath) {
			path = url.toAssetPath(sourceUrl);

		} else if (sourceUrl.filePath) {
			path = url.toFilePath(sourceUrl);
		}

		// we don't use source for compiled scripts in Rhino
		Titanium.runInContext(path, sourceUrl.href, true, true, currentWindow);
		return;
	}

	if (!('protocol' in sourceUrl)) {
		source = assets.readAsset(filename);

	} else if (sourceUrl.filePath) {
		var filepath = url.toFilePath(sourceUrl);
		source = assets.readFile(filepath);

	} else if (sourceUrl.assetPath) {
		var assetPath = url.toAssetPath(sourceUrl);
		source = assets.readAsset(assetPath);
	}

	Titanium.runInContext(source, sourceUrl.href, true, false, currentWindow);
}
Titanium.include = TiInclude;

// Run a script in the current context.
// Returns the result of the script or throws an exception
// if an error occurs. If displayError is true, any exceptions
// will be logged.
Titanium.runInContext = function(source, url, displayError, isPath, currentWindow) {

	// Use the prototype inheritance chain
	// to copy and maintain the Titanium dynamic
	// getters/setters
	function SandboxTitanium() {}
	SandboxTitanium.prototype = Titanium;

	var sandboxTi = new SandboxTitanium();
	sandbox = { Ti: sandboxTi, Titanium: sandboxTi };

	sandbox.Ti.sourceUrl = url;
	sandbox.Ti.include = function(filename, baseUrl) {
		baseUrl = typeof(baseUrl) === 'undefined' ? url : baseUrl;
		TiInclude(filename, baseUrl);
	}
	sandbox.Ti.UI.currentWindow = currentWindow;

	Titanium.bindInvocationAPIs(sandboxTi, url);

	if (isPath) {
		// "source" is the actual path when "isPath" is true
		return Script.runInSandbox(source, url, sandbox);

	} else {
		var wrappedSource = "with(sandbox) { " + source + "\n }";
		return Script.runInThisContext(wrappedSource, url, displayError);
	}
}

Titanium.bindInvocationAPIs = function(sandboxTi, url) {
	// This loops through all known APIs that require an
	// Invocation object and wraps them so we can pass a
	// source URL as the first argument

	function genInvoker(invocationAPI) {
		var names = invocationAPI.namespace.split(".");
		var apiNamespace = sandboxTi;
		var realAPI = tiBinding.Titanium;

		for (var j = 0, namesLen = names.length; j < namesLen; ++j) {
			var name = names[j];
			function SandboxAPI() {}
			SandboxAPI.prototype = apiNamespace[name];

			var api = new SandboxAPI();
			apiNamespace[name] = api;
			apiNamespace = api;
			realAPI = realAPI[name];
		}

		// These invokers form a call hierarchy so we need to
		// provide a way back to the actual root Titanium / actual impl.
		var delegate = realAPI[invocationAPI.api];
		while (delegate.__delegate__) {
			delegate = delegate.__delegate__;
		}

		function createInvoker(delegate) {
			var urlInvoker = function invoker() {
				var args = Array.prototype.slice.call(arguments);
				args.splice(0, 0, invoker.__url__);

				return delegate.apply(invoker.__thisObj__, args);
			}

			urlInvoker.__url__ = url;
			urlInvoker.__delegate__ = delegate;
			urlInvoker.__thisObj__ = realAPI;
			return urlInvoker;
		}

		apiNamespace[invocationAPI.api] = createInvoker(delegate);
	}

	var len = Titanium.invocationAPIs.length;
	for (var i = 0; i < len; ++i) {
		// separate each invoker into it's own private scope
		genInvoker(Titanium.invocationAPIs[i]);
	}
}

Titanium.Proxy = Proxy;

// Use defineProperty so we can avoid our custom extensions being enumerated
Object.defineProperty(Object.prototype, "extend", {
	value: function(other) {
		if (!other) return;
	
		for (var name in other) {
			if (other.hasOwnProperty(name)) {
				this[name] = other[name];
			}
		}
		return this;
	},
	enumerable: false
});

Proxy.defineProperties = function(proxyPrototype, names) {
	var properties = {};
	var len = names.length;

	for (var i = 0; i < len; ++i) {
		var name = names[i];
		properties[name] = {
			get: function() { return this.getProperty(name); },
			set: function(value) { this.setPropertyAndFire(name, value); },
			enumerable: true
		};
	}

	Object.defineProperties(proxyPrototype, properties);
}

Object.defineProperty(Proxy.prototype, "getProperty", {
	value: function(property) {
		return this._properties[property];
	},
	enumerable: false
});

Object.defineProperty(Proxy.prototype, "setProperty", {
	value: function(property, value) {
		return this._properties[property] = value;
	},
	enumerable: false
});

Object.defineProperty(Proxy.prototype, "setPropertiesAndFire", {
	value: function(properties) {
		var ownNames = Object.getOwnPropertyNames(properties);
		var len = ownNames.length;
		var changes = [];

		for (var i = 0; i < len; ++i) {
			var property = ownNames[i];
			var value = properties[property];

			if (!property) continue;

			var oldValue = this._properties[property];
			this._properties[property] = value;

			if (value != oldValue) {
				changes.push([property, oldValue, value]);
			}
		}

		if (changes.length > 0) {
			this.onPropertiesChanged(changes);
		}
	},
	enumerable: false
});

// Custom native modules
bootstrap.defineLazyBinding(Titanium, "API");

Object.defineProperty(Titanium, "Yahoo", {
	get: function() {
		return bootstrap.lazyGet(this, "yahoo", "Yahoo");
	},
	configurable: true
});

// Define lazy initializers for all Titanium APIs
bootstrap.bootstrap(Titanium);

// Custom JS extensions to Java modules
require("ui").bootstrap(Titanium);

var Properties = require("properties");
Properties.bootstrap(Titanium);

// Do not serialize the parent view. Doing so will result
// in a circular reference loop.
Titanium.TiView.prototype.toJSON = function () {
	var keys = Object.keys(this);
	var keyCount = keys.length;
	var serialized = {};

	for (var i = 0; i < keyCount; i++) {
		var k = keys[i];
		if (k === "parent") {
			continue;
		}
		serialized[k] = this[k];
	}

	return serialized;
}

// Finally, sandbox and bind the top level Titanium object
function SandboxTitanium() {}
SandboxTitanium.prototype = Titanium;

var sandboxTi = new SandboxTitanium();
Titanium.bindInvocationAPIs(sandboxTi, Titanium.sourceUrl);

module.exports = sandboxTi;
