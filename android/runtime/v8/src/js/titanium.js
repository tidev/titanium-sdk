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

// assign any Titanium props/methods/aliases here
Titanium.include = function tiInclude(filename, baseUrl) {
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


	var sandbox = {}.extend(global);
	sandbox.Ti.include = function(filename, baseUrl) {
		baseUrl = typeof(baseUrl) === 'undefined' ? sourceUrl.href : baseUrl;
		tiInclude(filename, baseUrl);
	}

	Script.runInNewContext(source, sandbox, sourceUrl.href);

	sandbox.Ti.include = tiInclude;
	global.extend(sandbox);
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

module.exports = Titanium;
