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
	url = require('url'),
	invoker = require('invoker');

var TAG = "Titanium";

// The app entry point
Titanium.sourceUrl = "app://app.js";

// A list of java APIs that need an invocation-specific URL
// passed in as the first argument
Titanium.invocationAPIs = [];

// A list of 3rd party (external) modules
Titanium.externalModules = [];

// Define lazy initializers for all Titanium APIs
bootstrap.bootstrap(Titanium);

// Custom JS extensions to Java modules
require("ui").bootstrap(Titanium);

var Properties = require("properties");
Properties.bootstrap(Titanium);

// Custom native modules
bootstrap.defineLazyBinding(Titanium, "API")

// Context-bound modules -------------------------------------------------
//
// Specialized modules that require binding context specific data
// within a script execution scope. This is how Ti.UI.currentWindow,
// Ti.Android.currentActivity, and others are implemented.
function TitaniumWrapper(context) {
	var sourceUrl = this.sourceUrl = context.sourceUrl;

	// The "context" specific global object
	this.global = context.global;
	var self = this;

	// Special version of include to handle relative paths based on sourceUrl.
	this.include = function() {
		var baseUrl, scopeVars;
		var fileCount = arguments.length;
		var info = arguments[fileCount - 1];

		if (info instanceof Array) {
			fileCount--;
			baseUrl = info[0];
			scopeVars = info[1];
		} else {
			baseUrl = sourceUrl;
			scopeVars = context || {};
		}

		scopeVars.global = self.global;
		for (var i = 0; i < fileCount; i++) {
			TiInclude(arguments[i], baseUrl, scopeVars);
		}
	}

	this.Android = new AndroidWrapper(context);
	this.UI = new UIWrapper(context, this.Android);

	Object.defineProperty(this, "ressourcesRelativePath", {
		get: function() {
			var value = context.sourceUrl.replace("app://", "");
			return value;
		}
	});

	var scopeVars = new kroll.ScopeVars({
		sourceUrl: sourceUrl,
		module: context.module,
		currentActivity: this.Android.currentActivity,
		currentService: this.Android.currentService
	});
	Titanium.bindInvocationAPIs(this, scopeVars);
}
TitaniumWrapper.prototype = Titanium;
Titanium.Wrapper = TitaniumWrapper;

function UIWrapper(context, Android) {
	this.currentWindow = context.currentWindow;
	this.currentTab = context.currentTab;
	this.currentTabGroup = context.currentTabGroup;

	if (!context.currentWindow && Android.currentActivity) {
		this.currentWindow = Android.currentActivity.window;
	}
}
UIWrapper.prototype = Titanium.UI;

function AndroidWrapper(context) {
	this.currentActivity = context.currentActivity;
	this.currentService = context.currentService;
	var currentWindow = context.currentWindow;

	if (!this.currentActivity) {
		var topActivity;
		if (currentWindow && currentWindow.window && currentWindow.window.activity) {
			this.currentActivity = currentWindow.activity;

		} else if (topActivity = Titanium.App.Android.getTopActivity()) {
			this.currentActivity = topActivity;
		}
	}
}
AndroidWrapper.prototype = Titanium.Android;

// -----------------------------------------------------------------------

function createSandbox(ti, sourceUrl) {
	var newSandbox = { Ti: ti, Titanium: ti };

	if (kroll.runtime == "rhino") {
		newSandbox = kroll.createSandbox(newSandbox, ti.global);
	}


	// The require function we want to wrap for this context
	var contextRequire = global.require;
	if (ti.global) {
		contextRequire = ti.global.require;
	}

	// Wrap require in Ti.include contexts so the relative sourceUrl is correct
	newSandbox.require = function(path, context) {
		if (context === undefined) {
			context = {};
		}

		if (!context.sourceUrl) {
			context.sourceUrl = sourceUrl;
		}

		return contextRequire(path, context, sourceUrl);
	}

	return newSandbox;
}

// Initializes a ScopeVars object with a
// passed in sourceURL (resolved from url.resolve)
function initScopeVars(scopeVars, sourceUrl) {
	var contextUrl = sourceUrl.href;

	if (kroll.runtime == "rhino") {
		contextUrl = require("rhino").getSourceUrl(sourceUrl);
	}

	scopeVars = scopeVars || {};
	scopeVars.sourceUrl = contextUrl;
	return scopeVars;
}
Titanium.initScopeVars = initScopeVars;

// Gets the source string for a specified URL / filename combo
function getUrlSource(filename, sourceUrl) {
	var source;

	// Load the source code for the script.
	if (!('protocol' in sourceUrl)) {
		source = assets.readAsset(filename);
	} else if (sourceUrl.filePath) {
		var filepath = url.toFilePath(sourceUrl);
		source = assets.readFile(filepath);
	} else if (sourceUrl.assetPath) {
		var assetPath = url.toAssetPath(sourceUrl);
		source = assets.readAsset(assetPath);
	} else {
		throw new Error("Unable to load source for filename: " + filename);
	}
	return source;
}
Titanium.getUrlSource = getUrlSource;

// This is the implementation of Ti.include (and it's wrappers/delegates)
// Ti.include executes code in the current "context", and
// also supports relative paths based on the current file.
//
// We have some complicated code to get this working, namely:
// - Every "context" (i.e. window with a URL, or app.js) is actually a CommonJS module in disguise, with caching disabled
// - Every "context" has it's own top level / global object
// - Ti.include code is executed in the context that it's called from
// - Each "context" and each Ti.include file gets it's own version of Ti.include / require that wraps this implementation, passing a different baseUrl
// - We use TitaniumWrapper as the base for all context / scope-specific APIs
function TiInclude(filename, baseUrl, scopeVars) {
	var sourceUrl = url.resolve(baseUrl, filename);
	scopeVars = initScopeVars(scopeVars, sourceUrl);

	// Create a context-bound Titanium module.
	var ti = new TitaniumWrapper(scopeVars);

	// This is called "localSandbox" so we don't overshadow the "sandbox" on global scope
	var localSandbox = createSandbox(ti, scopeVars.sourceUrl);

	if (kroll.runtime == 'rhino') {
		// In Rhino we use a different code path to support pre-compiled JS
		return require("rhino").include(filename, baseUrl, localSandbox);

	} else {
		var source = getUrlSource(filename, sourceUrl);
		var wrappedSource = "with(sandbox) { " + source + "\n }";
		var contextGlobal = ti.global;
		var filePath = sourceUrl.href.replace("app://", "");

		if (contextGlobal) {
			// We're running inside another window or module, so we run against it's context
			contextGlobal.sandbox = localSandbox;
			return Script.runInContext(wrappedSource, contextGlobal, filePath, true);

		} else {
			// We're running in the main module (app.js), so we use the global V8 Context directly.
			// Put sandbox on the global scope
			sandbox = localSandbox;
			return Script.runInThisContext(wrappedSource, filePath, true);
		}
	}
}
TiInclude.prototype = global;
Titanium.include = TiInclude;

// This loops through all known APIs that require an
// Invocation object and wraps them so we can pass a
// source URL as the first argument
Titanium.bindInvocationAPIs = function(wrapperTi, scopeVars) {
	var len = Titanium.invocationAPIs.length;
	for (var i = 0; i < len; ++i) {
		// separate each invoker into it's own private scope
		invoker.genInvoker(wrapperTi, tiBinding.Titanium,
			"Titanium", Titanium.invocationAPIs[i], scopeVars);
	}
}

Titanium.Proxy = Proxy;

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
		delete this.Yahoo;
		delete this.__proto__.Yahoo;

		var value = require("yahoo").bootstrap(Titanium);
		this.Yahoo = this.__proto__.Yahoo = value;

		return value;
	}
});

// Do not serialize the parent view. Doing so will result
// in a circular reference loop.
Object.defineProperty(Titanium.TiView.prototype, "toJSON", {
	value: function () {
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
	},
	enumerable: false
});

Object.defineProperty(Titanium.Activity.prototype, "toJSON", {
	value: function () {
		var keys = Object.keys(this);
		var keyCount = keys.length;
		var serialized = {};

		for (var i = 0; i < keyCount; i++) {
			var k = keys[i];
			if (k === "activity" || k === "window" || k === "intent") {
				continue;
			}
			serialized[k] = this[k];
		}

		return serialized;
	},
	enumerable: false
});

module.exports = new TitaniumWrapper({
	sourceUrl: Titanium.sourceUrl
});
