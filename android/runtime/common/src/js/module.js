/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var NativeModule = require('native_module');
var assets = kroll.binding('assets');
var path = require('path');
var runInThisContext = require('vm').runInThisContext;
var TAG = "Module";

function Module(id, parent, context) {
	this.id = id;
	this.exports = {};
	this.parent = parent;
	this.context = context;

	this.filename = null;
	this.loaded = false;
	this.exited = false;
	this.children = [];
}
kroll.Module = module.exports = Module;

Module.cache = [];
Module.main = null;
Module.paths = [ 'Resources/' ];
Module.wrap = NativeModule.wrap;

Module.runModule = function (source, filename, activity) {
	var id = filename;
	if (!Module.main) {
		id = ".";
	}

	var module = new Module(id, null, {
		currentActivity: activity,
		currentWindow: activity ? activity.window : null
	});

	if (!Module.main) {
		Module.main = module;
	}

	module.load(filename, source, activity);
	return module;
}

// Run a module as the main entry point.
Module.runMainModule = function (source, filename) {
	var mainModule = Module.main = new Module('.');
	mainModule.load(filename, source);
	return true;
}

// Attempts to load the module. If no file is found
// with the provided name an exception will be thrown.
// Once the contents of the file are read, it is ran
// in the current context. A sandbox is created by
// executing the code inside a wrapper function.
// This provides a speed boost vs creating a new context.
//
// Returns the exports object of the loaded module if successful.
Module.prototype.load = function (filename, source) {
	kroll.log(TAG, 'Loading module: "' + filename + '"');

	if (this.loaded) {
		throw new Error("Module already loaded.");
	}

	this.filename = filename;

	if (!source) {
		source = assets.readAsset(filename);
	}

	this._runScript(source, filename);

	this.loaded = true;
}

// Require another module as a child of this module.
// This parent module's path is appended to the search paths
// when loading the child. Returns the exports object
// of the child module.
Module.prototype.require = function (request, context) {
	kroll.log(TAG, 'Requesting module: "' + request + '"');

	// Delegate native module requests.
	if (NativeModule.exists(request)) {
		kroll.log(TAG, 'Found native module: "' + request + '"');
		return NativeModule.require(request);
	}

	// get external binding
	var externalBinding = kroll.externalBinding(request);
	if (externalBinding) {
		var bindingKey = Object.keys(externalBinding)[0];
		if (bindingKey) {
			return externalBinding[bindingKey];
		}

		kroll.log(TAG, "unable to find the external module" + request);
	}

	var resolved = resolveFilename(request, this);
	var id = resolved[0];
	var filename = resolved[1];

	kroll.log(TAG, 'Loading module "' + request + '" using filename: "' + filename + '"');

	var cachedModule = Module.cache[filename];
	if (cachedModule) {
		return cachedModule.exports;
	}

	// Create and attempt to load the module.
	var module = new Module(id, this, context);
	module.load(filename);

	// Cache the module for future requests.
	Module.cache[filename] = module;

	return module.exports;
}

// Setup a sandbox and run the module's script inside it.
// Returns the result of the executed script.
Module.prototype._runScript = function (source, filename) {
	var self = this;
	var url = "app://" + filename.replace("Resources/", "");

	function require(path, context) {
		return self.require(path, context);
	}
	require.main = Module.main;

	if (self.id == '.') {
		global.require = require;
		Titanium.Android.currentActivity = self.context.currentActivity;

		return runInThisContext(source, filename, true);
	}

	// Create context-bound modules.
	var context = self.context || {};
	context.sourceUrl = url;

	var ti = new Titanium.Wrapper(context);

	// Execute the module inside a wrapper to prevent
	// globals from leaking into the global scope.
	var wrapper = Module.wrap(source);
	var compiledWrapper = runInThisContext(wrapper, filename, true);
	var args = [self.exports, require, self, filename, path.dirname(filename), ti, ti, global, kroll];
	return compiledWrapper.apply(self.exports, args);
}

// Determine the paths where the requested module could live.
// Returns [id, paths]  where id is the module ID and paths
// is the list of path names.
function resolveLookupPaths(request, parentModule) {
	var start = request.substring(0, 2);
	if (start !== './' && start !== '..') {
		var paths = Module.paths;
		if (parentModule) {
			if (!parentModule.paths) {
				parentModule.paths = [];
			}
			paths = parentModule.paths.concat(paths);
		}
		return [request, paths];
	}

	// Get the path to the parent module. If the parent
	// is an index file, its ID is already the directory path.
	// Ex: path.id = "a/" if index
	//     path.id = "a/b" if non-index
	var isIndex = /^index\.\w+?$/.test(path.basename(parentModule.filename));
	var parentIdPath = isIndex ? parentModule.id : path.dirname(parentModule.id);
	var id = path.resolve(parentIdPath, request);

	// make sure require('./path') and require('path') get distinct ids, even
	// when called from the toplevel js file
	if (parentIdPath === '.' && id.indexOf('/') === -1) {
		id = './' + id;
	}

	return [id, [path.dirname(parentModule.filename)]];
}

// Determine the filename that contains the request
// module's source code. If no file is found an exception
// will be thrown.
function resolveFilename(request, parentModule) {
	var resolvedModule = resolveLookupPaths(request, parentModule);
	var id = resolvedModule[0];
	var paths = resolvedModule[1];

	// Try each possible path where the module's source file
	// could be located.
	for (var i = 0, pathCount = paths.length; i < pathCount; ++i) {
		var filename = path.resolve(paths[i], id) + '.js';
		if (filenameExists(filename)) {
			return [id, filename];
		}
	}

	throw new Error("Requested module not found: " + request);
}

var fileIndex;

function filenameExists(filename) {
	if (!fileIndex) {
		var json = assets.readAsset("index.json");
		fileIndex = JSON.parse(json);
	}

	return filename in fileIndex;
}

