/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var NativeModule = require('native_module');
var Script = kroll.binding('evals').Script;
var assets = kroll.binding('assets');
var path = require('path');
var runInThisContext = Script.runInThisContext;

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

Module.cache = [];
Module.main = null;
Module.paths = [ 'Resources/' ];

// Run a module as the main entry point.
Module.runMainModule = function (source, filename) {
	var mainModule = Module.main = new Module('.');
	mainModule.load(filename, source);
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
	kroll.log('Loading ' + filename);

	if (this.loaded) {
		throw new Error("Module already loaded.");
	}

	this.filename = filename;

	if (!source) {
		source = assets.readResource(filename);
	}

	this._runScript(source, filename);

	this.loaded = true;
}

// Require another module as a child of this module.
// This parent module's path is appended to the search paths
// when loading the child. Returns the exports object
// of the child module.
Module.prototype.require = function (request) {
	kroll.log('Requesting module ' + request);

	// Delegate native module requests.
	if (NativeModule.exists(request)) {
		return NativeModule.require(request);
	}

	var resolved = resolveFilename(request, this.parent);
	var id = resolved[0];
	var filename = resolved[1];

	var cachedModule = Module.cache[filename];
	if (cachedModule) {
		return cachedModule.exports;
	}

	// Create and attempt to load the module.
	var module = new Module(id, this);
	module.load(filename);

	// Cache the module for future requests.
	Module.cache[filename] = module;

	return module.exports;
}

// Setup a sandbox and run the module's script inside it.
// Returns the result of the executed script.
Module.prototype._runScript = function (source, filename) {
	var self = this;

	function require(path) {
		return self.require(path);
	}

	require.main = Module.main;

	global.require = require;
	global.exports = self.exports;
	global.__filename = filename;
	global.__dirname = path.dirname(filename);
	global.module = self;

	// TODO(josh): use marshall's version of this instead.
    return runInThisContext(source, filename, true);
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
	var isIndex = /^index\.\w+?$/.test(path.basename(parent.filename));
	var parentIdPath = isIndex ? parent.id : path.dirname(parent.id);
	var id = path.resolve(parentIdPath, request);

	// make sure require('./path') and require('path') get distinct ids, even
	// when called from the toplevel js file
	if (parentIdPath === '.' && id.indexOf('/') === -1) {
		id = './' + id;
	}

	return [id, [path.dirname(parent.filename)]];
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
        var json = assets.readResource("index.json");
        fileIndex = JSON.parse(json);
	}

	return filename in fileIndex;
}

