/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var NativeModule = require('native_module'),
	assets = kroll.binding('assets'),
	path = require('path'),
	Script = kroll.binding('evals').Script,
	runInThisContext = require('vm').runInThisContext,
	bootstrap = require('bootstrap'),
	invoker = require('invoker');

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
	this.wrapperCache = {};
}
kroll.Module = module.exports = Module;

Module.cache = [];
Module.main = null;
Module.paths = [ 'Resources/' ];
Module.wrap = NativeModule.wrap;

Module.runModule = function (source, filename, activityOrService) {
	var id = filename;
	if (!Module.main) {
		id = ".";
	}

	var module,
		isService = (activityOrService instanceof Titanium.Service);

	if (isService) {
		module = new Module(id, null, {
			currentService: activityOrService,
			currentActivity: null,
			currentWindow: null
		});
	} else {
		module = new Module(id, null, {
			currentService: null,
			currentActivity: activityOrService,
			currentWindow: activityOrService ? activityOrService.window : null
		});
	}

	if (!Module.main) {
		Module.main = module;
	}

	module.load(filename, source)
	return module;
}

// Attempts to load the module. If no file is found
// with the provided name an exception will be thrown.
// Once the contents of the file are read, it is run
// in the current context. A sandbox is created by
// executing the code inside a wrapper function.
// This provides a speed boost vs creating a new context.
//
// Returns the exports object of the loaded module if successful.
Module.prototype.load = function (filename, source) {
	if (this.loaded) {
		throw new Error("Module already loaded.");
	}

	this.filename = filename;
	this.paths = [path.dirname(filename)];

	if (!source) {
		source = assets.readAsset(filename);
	}

	this._runScript(source, filename.replace("Resources/", ""));

	this.loaded = true;
}


// Generates a context-specific module wrapper, and wraps
// each invocation API in an external (3rd party) module
// See invoker.js for more info
Module.prototype.createModuleWrapper = function(externalModule, sourceUrl) {

	// The module wrapper forwards on using the original as a prototype
	function ModuleWrapper() {}
	ModuleWrapper.prototype = externalModule;

	var wrapper = new ModuleWrapper();
	var invocationAPIs = externalModule.invocationAPIs;
	var invocationsLen = invocationAPIs.length;

	for (var j = 0; j < invocationsLen; ++j) {
		var api = invocationAPIs[j].api;
		var delegate = externalModule[api];
		if (!delegate) {
			continue;
		}

		wrapper[api] = invoker.createInvoker(externalModule, delegate, new kroll.ScopeVars({
			sourceUrl: sourceUrl,
			module: this
		}));
	}

	wrapper.addEventListener = function() {
		externalModule.addEventListener.apply(externalModule, arguments);
	}

	wrapper.removeEventListener = function() {
		externalModule.removeEventListener.apply(externalModule, arguments);
	}

	wrapper.fireEvent = function() {
		externalModule.fireEvent.apply(externalModule, arguments);
	}

	return wrapper;
}

function extendModuleWithCommonJs(externalModule, id, thiss, context) {
	if (kroll.isExternalCommonJsModule(id)) {
		var jsModule = new Module(id + ".commonjs", thiss, context);
		jsModule.load(id, kroll.getExternalCommonJsModule(id));
		if (jsModule.exports) {
			if (kroll.DBG) {
				kroll.log(TAG, "Extending native module '" + id + "' with the CommonJS module that was packaged with it.");
			}
			kroll.extend(externalModule, jsModule.exports);
		}
	}
}

// Loads a native / external (3rd party) module
Module.prototype.loadExternalModule = function(id, externalBinding, context) {

	var sourceUrl = context === undefined ? "app://app.js" : context.sourceUrl;
	var externalModule;
	var returnObj;

	externalModule = Module.cache[id];

	if (!externalModule) {
		// Get the compiled bootstrap JS
		var source = externalBinding.bootstrap;

		// Load the native module's bootstrap JS
		var module = new Module(id, this, context);
		module.load(id + "/bootstrap.js", source);

		// Bootstrap and load the module using the native bindings
		var result = module.exports.bootstrap(externalBinding);

		// Cache the external module instance
		externalModule = Module.cache[id] = result;
	}

	if (externalModule) {
		// We cache each context-specific module wrapper
		// on the parent module, rather than in the Module.cache
		var wrapper = this.wrapperCache[id];
		if (wrapper) {
			return wrapper;
		}

		wrapper = this.createModuleWrapper(externalModule, sourceUrl);

		extendModuleWithCommonJs(wrapper, id, this, context);

		this.wrapperCache[id] = wrapper;

		return wrapper;
	}

	if (kroll.DBG) {
		kroll.log(TAG, "Unable to load external module: " + id);
	}
}

// Require another module as a child of this module.
// This parent module's path is appended to the search paths
// when loading the child. Returns the exports object
// of the child module.
Module.prototype.require = function (request, context, useCache) {
	useCache = useCache === undefined ? true : useCache;
	var id;
	var filename;
	var cachedModule;
	var externalCommonJsContents;
	var located = false;

	var resolved = this.resolveFilename(request);

	if (resolved) {
		// Found it as an asset packaged in the app. (Resources/...).
		located = true;
		id = resolved[0];
		filename = resolved[1];

		if (useCache) {
			cachedModule = Module.cache[filename];
			if (cachedModule) {
				return cachedModule.exports;
			}
		}

	} else {
		// Already have this precise name wrapped and cached? If yes, quick exit.
		var wrapper = this.wrapperCache[request];
		if (wrapper) {
			return wrapper;
		}
		// External module?
		var pathResolve = resolveLookupPaths(request, this);
		id = pathResolve[0];
		var potentialPaths = pathResolve[1];

		for (var i = 0, pathCount = potentialPaths.length; i < pathCount; ++i) {
			var onePath = potentialPaths[i];
			if (onePath === "." || onePath === "Resources" || onePath.indexOf("Resources/") === 0) {
				// This could be a fully-pathed request for an external module
				// (or a CommonJS sub-module within an external module) from inside
				// an application JS file. We test that by simply ignoring the Resources
				// path since it won't be in there if it exists.
				filename = id;
			} else {
				filename = path.resolve(onePath, id);
			}

			// Something we already have cached?
			if (useCache) {
				cachedModule = Module.cache[filename];
				if (cachedModule) {
					wrapper = this.wrapperCache[filename];
					if (wrapper) {
						return wrapper;
					}
				}
			}

			var parts = filename.split("/");
			var checkExternal = parts[0];
			var externalBinding = kroll.externalBinding(checkExternal);
			if (externalBinding) {
				if (parts.length === 1 || (parts.length === 2 && parts[0] === parts[1])) {
					// This is the "root" of an external module. It can look like either:
					// request("com.example.mymodule") ... or ...
					// request("com.example.mymodule/com.example.mymodule")
					// We can load and return it right away (caching occurs in the called function).
					return this.loadExternalModule(parts[0], externalBinding, context);
				} else {
					// Could be a sub-module (CommonJS) of an external native module.
					// We allow that since TIMOB-9730.
					externalCommonJsContents = kroll.getExternalCommonJsModule(filename);
					if (externalCommonJsContents) {
						// Found it.
						located = true;
						break;
					}
				}
			}
		}
	}

	if (!located) {
		throw new Error("Requested module not found: " + request);
	}

	if (kroll.DBG) {
		kroll.log(TAG, 'Loading module: ' + request + ' -> ' + filename);
	}

	var module = new Module(id, this, context);

	// NOTE: We need to cache here to handle cyclic dependencies.
	// By caching early, this allows for a return of a "partially evaluated"
	// module, which can provide transitive properties in a way described
	// by the commonjs 1.1 spec.
	if (useCache) {
		Module.cache[filename] = module;
	}

	if (externalCommonJsContents) {
		module.load(filename, externalCommonJsContents);
	} else {
		module.load(filename);
	}

	return module.exports;
}

// Setup a sandbox and run the module's script inside it.
// Returns the result of the executed script.
Module.prototype._runScript = function (source, filename) {
	var self = this,
		url = "app://" + filename;

	function require(path, context) {
		return self.require(path, context);
	}
	require.main = Module.main;

	// This "first time" run is really only for app.js, AFAICT, and needs
	// an activity. If app was restarted for Service only, we don't want
	// to go this route. So added currentActivity check. (bill)
	if (self.id == '.' && self.context.currentActivity) {
		global.require = require;
		Titanium.Android.currentActivity = self.context.currentActivity;

		return runInThisContext(source, filename, true);
	}

	// Create context-bound modules.
	var context = self.context || {};
	context.sourceUrl = url;
	context.module = this;

	var ti = new Titanium.Wrapper(context);

	// In V8, we treat external modules the same as native modules.  First, we wrap the
	// module code and then run it in the current context.  This will allow external modules to
	// access globals as mentioned in TIMOB-11752. This will also help resolve startup slowness that
	// occurs as a result of creating a new context during startup in TIMOB-12286.
	source = Module.wrap(source);

	var f = Script.runInThisContext(source, filename, true);
	return f(this.exports, require, this, filename, path.dirname(filename), ti, ti, global, kroll);
}

// Determine the paths where the requested module could live.
// Returns [id, paths]  where id is the module ID and paths
// is the list of path names.
function resolveLookupPaths(request, parentModule) {

	// "absolute" in Titanium is relative to the Resources folder
	if (request.charAt(0) === '/') {
		request = request.substring(1);
	}

	var start = request.substring(0, 2);
	if (start !== './' && start !== '..') {
		var paths = Module.paths;
		if (parentModule) {
			if (!parentModule.paths) {
				parentModule.paths = [];
			}
			// Check if parent is root CommonJS module packaged
			// with a native external module, in which case the
			// module id is itself a path that needs to be checked.
			var parentId = parentModule.id;
			var pos = parentId.lastIndexOf(".commonjs");
			if (pos === parentId.length - ".commonjs".length) {
				paths = [parentId.substr(0, pos)].concat(paths);
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

	// The module ID is resolved now, so we use the root "Module.paths" as the lookup base
	return [id, Module.paths];
}

// Determine the filename that contains the request
// module's source code. If no file is found an exception
// will be thrown.
Module.prototype.resolveFilename = function (request) {
	var resolvedModule = resolveLookupPaths(request, this);
	var id = resolvedModule[0];
	var paths = resolvedModule[1];

	// Try each possible path where the module's source file
	// could be located.
	for (var i = 0, pathCount = paths.length; i < pathCount; ++i) {
		var filename = path.resolve(paths[i], id) + '.js';
		if (this.filenameExists(filename) || assets.fileExists(filename)) {
			return [id, filename];
		}
	}

	return null;
}

var fileIndex;

Module.prototype.filenameExists = function (filename) {
	if (!fileIndex) {
		var json = assets.readAsset("index.json");
		fileIndex = JSON.parse(json);
	}

	return filename in fileIndex;
}