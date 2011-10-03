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

// the app entry point
Titanium.sourceUrl = "app://app.js";

// a list of java APIs that need an invocation-specific URL
// passed in as the first argument
Titanium.invocationAPIs = [];

function TiInclude(filename, baseUrl) {
	baseUrl = typeof(baseUrl) === 'undefined' ? "app://app.js" : baseUrl;
	var sourceUrl = url.resolve(baseUrl, filename);
	var source;

	if (!('protocol' in sourceUrl)) {
		source = assets.readResource(filename);

	} else if (sourceUrl.filePath) {
		var filepath = url.toFilePath(sourceUrl);
		source = assets.readFile(filepath);

	} else if (sourceUrl.assetPath) {
		var assetPath = url.toAssetPath(sourceUrl);
		source = assets.readResource(assetPath);
	}

	Titanium.runInContext(source, sourceUrl.href);
}
Titanium.include = TiInclude;

Titanium.runInContext = function(source, url) {
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

	Titanium.bindInvocationAPIs(sandboxTi, url);

	var wrappedSource = "with(sandbox) { " + source + " }";
	return Script.runInThisContext(wrappedSource, url);
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

		var delegate = realAPI[invocationAPI.api];

		function invoker() {
			var args = Array.prototype.slice.call(arguments);
			args.splice(0, 0, url);
			return delegate.apply(this, args);
		}

		// These invokers form a call hierarchy so we need to
		// provide a way back to the actual root Titanium / actual impl.
		while ("__parent__" in delegate) {
			delegate = delegate.__parent__;
		}
		invoker.__parent__ = delegate;

		apiNamespace[invocationAPI.api] = invoker;
	}

	var len = Titanium.invocationAPIs.length;
	for (var i = 0; i < len; ++i) {
		// separate each invoker into it's own private scope
		genInvoker(Titanium.invocationAPIs[i]);
	}
}


Titanium.Proxy = Proxy;

Object.prototype.extend = function(other) {
	if (!other) return;

	for (var name in other) {
		if (other.hasOwnProperty(name)) {
			this[name] = other[name];
		}
	}
	return this;
}

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

Proxy.prototype.getProperty = function(property) {
	return this._properties[property];
}

Proxy.prototype.setPropertyAndFire = function(property, value) {
	if (!property) return false;

	var oldValue = this._properties[property];
	this._properties[property] = value;

	kroll.log("setting " + property + " to " + value + ", oldValue = " + oldValue);
	if (oldValue != value) {
		kroll.log("calling onPropertyChanged = " + this.onPropertyChanged);
		this.onPropertyChanged(property, oldValue, value);
	}
}

Proxy.prototype.setPropertiesAndFire = function(properties) {
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
}

// Custom native modules
bootstrap.defineLazyBinding(Titanium, "API");

// Custom JS extensions to Java modules
var Window;
bootstrap.defineLazyGetter("UI", "Window", function() {
	if (!Window) {
		Window = require("window").bootstrapWindow(Titanium);
	}
	return Window;
});

bootstrap.defineLazyGetter("UI", "createWindow", function() {
	if (!Window) {
		Window = require("window").bootstrapWindow(Titanium);
	}
	return this.createWindow;
});

// Define lazy initializers for all Titanium APIs
bootstrap.bootstrap(Titanium);
Titanium.bindInvocationAPIs(Titanium, Titanium.sourceUrl);

module.exports = Titanium;
