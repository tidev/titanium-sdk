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
	var wrappedSource = '(function (exports, require, module, __filename, __dirname) { ' + source + '\n});'

	var wrappedFile = kroll.binding('evals').Script.runInThisContext(source, filename + '.js', true);
	wrappedFile(exports, require, this, filename);
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

bootstrap.defineProperties("UI", {
	Window: { get: function() {
		delete this.Window;
		this.Window = require("window").Window;
		return this.Window;
	}}
});

bootstrap.bootstrap(Titanium);

module.exports = Titanium;
