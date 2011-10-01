/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var Titanium = kroll.binding('Titanium').Titanium,
	bootstrap = require('bootstrap');

// assign any Titanium props/methods/aliases here
Titanium.include = function(filename) {
	var source = kroll.binding('assets').readResource(filename);
	var wrappedFile = kroll.binding('evals').Script.runInThisContext(source, filename, true);
}

Object.prototype.extend = function(other) {
	if (!other) return;

	for (name in other) {
		if (other.hasOwnProperty(name)) {
			this[name] = other[name];
		}
	}
	return this;
}

// Custom native modules
bootstrap.defineLazyBinding(Titanium, "API");

// Custom JS extensions to Java modules
bootstrap.defineLazyGetter("UI", "Window", function() {
	return require("window").bootstrapWindow(Titanium);
});

// Define lazy initializers for all Titanium APIs
bootstrap.bootstrap(Titanium);

module.exports = Titanium;
