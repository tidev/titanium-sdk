/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var NativeModule = require('native_module');
var Script = kroll.binding('evals').Script;
var runInThisContext = Script.runInThisContext;
var runInNewContext = Script.runInNewContext;

function Module(id, parent) {
	this.id = id;
	this.exports = {};
	this.parent = parent;

	this.filename = null;
	this.loaded = false;
	this.exited = false;
	this.children = [];
}
module.exports = Module;
