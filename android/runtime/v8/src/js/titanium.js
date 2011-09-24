/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var binding = kroll.binding('titanium');
var Titanium = binding.Titanium;

// assign any Titanium props/methods/aliases here

Object.prototype.extend = function(other) {
	if (!object) return;

	for (name in object) {
		this[name] = object[name];
	}
	return this;
}

module.exports = Titanium;
