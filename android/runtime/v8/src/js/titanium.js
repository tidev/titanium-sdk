/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var binding = kroll.binding('Titanium');
var Titanium = binding.Titanium;

// assign any Titanium props/methods/aliases here

Titanium.include = function(filename) {
	var source = kroll.binding('assets').readResource(filename);
	var wrappedSource = '(function (exports, require, module, __filename, __dirname) { ' + source + '\n});'

	var wrappedFile = kroll.binding('evals').Script.runInThisContext(source, filename + '.js', true);
	wrappedFile(exports, require, this, filename);
}

Object.prototype.extend = function(other) {
	if (!object) return;

	for (name in object) {
		if (object.hasOwnProperty(name)) {
			this[name] = object[name];
		}
	}
	return this;
}

function defineModuleGetter(module, name) {
	module.__defineGetter__(name, function() {
		return kroll.binding(name)[name];
	});	
}

defineModuleGetter(Titanium, "API");
defineModuleGetter(Titanium, "UI");
defineModuleGetter(Titanium, "Media");
defineModuleGetter(Titanium, "Filesystem");
defineModuleGetter(Titanium, "Utils");

module.exports = Titanium;
