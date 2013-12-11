/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var bootstrap = require("bootstrap");

// Objects retained by persistent handles.
// Each element in this array acts as a storage "cell"
// keeping the object reachable and alive until it is removed.
persistentObjects = [];

// Keeps an object alive until dispose() is called.
function PersistentHandle(object) {
	this.cell = persistentObjects.length;
	persistentObjects.push(object);
}

PersistentHandle.prototype.dispose = function() {
	if (this.cell == -1) {
		// This handle has already been disposed.
		return;
	}

	persistentObjects.splice(this.cell, 1);
	this.cell = -1;
}

exports.PersistentHandle = PersistentHandle;

exports.bootstrap = function(Titanium) {
	require("httpclient").bootstrap(Titanium);
}