/**
 * Appcelerator Titanium Mobile
 *
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
'use strict';

var tiBinding = kroll.binding('Titanium'),
	Titanium = tiBinding.Titanium,
	Proxy = tiBinding.Proxy,
	bootstrap = require('bootstrap'),
	invoker = require('invoker');

// The app entry point
Titanium.sourceUrl = 'app://ti.main.js';

// A list of java APIs that need an invocation-specific URL
// passed in as the first argument
Titanium.invocationAPIs = [];

// A list of 3rd party (external) modules
Titanium.externalModules = [];

// Define lazy initializers for all Titanium APIs
bootstrap.bootstrap(Titanium);

// Custom JS extensions to Java modules
require('ui').bootstrap(Titanium);
require('network').bootstrap(Titanium);
require('properties').bootstrap(Titanium);
require('locale').bootstrap(Titanium);

// Custom native modules
bootstrap.defineLazyBinding(Titanium, 'API');

// Context-bound modules -------------------------------------------------
//
// Specialized modules that require binding context specific data
// within a script execution scope. This is how Ti.Android.currentService,
// and others are implemented.
function TitaniumWrapper(context) {
	var sourceUrl = this.sourceUrl = context.sourceUrl;

	// The "context" specific global object
	this.global = context.global;

	this.Android = new AndroidWrapper(context);

	var scopeVars = new kroll.ScopeVars({
		sourceUrl: sourceUrl,
		currentService: this.Android.currentService
	});
	Titanium.bindInvocationAPIs(this, scopeVars);
}
TitaniumWrapper.prototype = Titanium;
Titanium.Wrapper = TitaniumWrapper;

function AndroidWrapper(context) {
	this.currentService = context.currentService;
}
AndroidWrapper.prototype = Titanium.Android;

// -----------------------------------------------------------------------

// Initializes a ScopeVars object with a
// passed in sourceURL (resolved from url.resolve)
function initScopeVars(scopeVars, sourceUrl) {
	scopeVars = scopeVars || {};
	scopeVars.sourceUrl = sourceUrl;
	return scopeVars;
}
Titanium.initScopeVars = initScopeVars;

// This loops through all known APIs that require an
// Invocation object and wraps them so we can pass a
// source URL as the first argument
Titanium.bindInvocationAPIs = function (wrapperTi, scopeVars) {
	var len = Titanium.invocationAPIs.length;
	for (var i = 0; i < len; ++i) {
		// separate each invoker into it's own private scope
		invoker.genInvoker(wrapperTi, tiBinding.Titanium,
			'Titanium', Titanium.invocationAPIs[i], scopeVars);
	}
};

Titanium.Proxy = Proxy;

Proxy.defineProperties = function (proxyPrototype, names) {
	var properties = {};
	var len = names.length;

	for (var i = 0; i < len; ++i) {
		var name = names[i];
		properties[name] = {
			get: function () { // eslint-disable-line no-loop-func
				return this.getProperty(name);
			},
			set: function (value) { // eslint-disable-line no-loop-func
				this.setPropertyAndFire(name, value);
			},
			enumerable: true
		};
	}

	Object.defineProperties(proxyPrototype, properties);
};

Object.defineProperty(Proxy.prototype, 'getProperty', {
	value: function (property) {
		return this._properties[property];
	},
	enumerable: false
});

Object.defineProperty(Proxy.prototype, 'setProperty', {
	value: function (property, value) {
		return this._properties[property] = value;
	},
	enumerable: false
});

Object.defineProperty(Proxy.prototype, 'setPropertiesAndFire', {
	value: function (properties) {
		var ownNames = Object.getOwnPropertyNames(properties);
		var len = ownNames.length;
		var changes = [];

		for (var i = 0; i < len; ++i) {
			var property = ownNames[i];
			var value = properties[property];

			if (!property) {
				continue;
			}

			var oldValue = this._properties[property];
			this._properties[property] = value;

			if (value !== oldValue) {
				changes.push([ property, oldValue, value ]);
			}
		}

		if (changes.length > 0) {
			this.onPropertiesChanged(changes);
		}
	},
	enumerable: false
});

// Custom native modules
bootstrap.defineLazyBinding(Titanium, 'API');

// Do not serialize the parent view. Doing so will result
// in a circular reference loop.
Object.defineProperty(Titanium.TiView.prototype, 'toJSON', {
	value: function () {
		const keys = Object.keys(this);
		const keyCount = keys.length;
		const serialized = {};

		for (let i = 0; i < keyCount; i++) {
			const k = keys[i];
			if (k === 'parent' || k.charAt(0) === '_') {
				continue;
			}
			serialized[k] = this[k];
		}

		return serialized;
	},
	enumerable: false
});

Object.defineProperty(Titanium.UI.NavigationWindow.prototype, 'toJSON', {
	value: function () {
		const keys = Object.keys(this);
		const keyCount = keys.length;
		const serialized = {};

		for (let i = 0; i < keyCount; i++) {
			const k = keys[i];
			if (k === 'parent' || k === 'window' || k.charAt(0) === '_') {
				continue;
			}
			serialized[k] = this[k];
		}

		return serialized;
	},
	enumerable: false
});

Object.defineProperty(Titanium.Activity.prototype, 'toJSON', {
	value: function () {
		const keys = Object.keys(this);
		const keyCount = keys.length;
		const serialized = {};

		for (let i = 0; i < keyCount; i++) {
			const k = keys[i];
			if (k === 'window' || k === 'intent' || k.charAt(0) === '_') {
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
