/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var binding = kroll.binding('titanium');
var Titanium = binding.Titanium;

// assign any Titanium props/methods/aliases here
var KrollProxy = Titanium.KrollProxy;

KrollProxy.prototype.extend = function(object) {
	if (!object) return;

	for (name in object) {
		this[name] = object[name];
	}
}

module.exports = Titanium;
