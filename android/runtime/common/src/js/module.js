/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
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

/**
 * [Module description]
 * @param {String} id      [description]
 * @param {Module} parent  [description]
 * @param {Object} context [description]
 */
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
Module.wrap = NativeModule.wrap;

/**
 * [runModule description]
 * @param  {String} source            [description]
 * @param  {String} filename          [description]
 * @param  {[type]} activityOrService [description]
 * @return {Module}                   [description]
 */
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
	filename = filename.replace('Resources/', '/'); // normalize back to absolute paths (which really are relative to Resources under the hood)
	module.load(filename, source)
	return module;
}


/**
 * Attempts to load the module. If no file is found
 * with the provided name an exception will be thrown.
 * Once the contents of the file are read, it is run
 * in the current context. A sandbox is created by
 * executing the code inside a wrapper function.
 * This provides a speed boost vs creating a new context.
 *
 * Returns the exports object of the loaded module if successful.
 * @param  {String} filename [description]
 * @param  {String} source   [description]
 */
Module.prototype.load = function (filename, source) {
	if (this.loaded) {
		throw new Error("Module already loaded.");
	}

	this.filename = filename;
	this.path = path.dirname(filename);

	if (!source) {
		source = assets.readAsset('Resources' + filename);
	}

	// Stick it in the cache
	Module.cache[this.filename] = this;

	this._runScript(source, this.filename);

	this.loaded = true;
}


/**
 * Generates a context-specific module wrapper, and wraps
 * each invocation API in an external (3rd party) module
 * See invoker.js for more info
 * @param  {[type]} externalModule [description]
 * @param  {[type]} sourceUrl      [description]
 * @return {[type]}                [description]
 */
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

/**
 * [extendModuleWithCommonJs description]
 * @param  {Object} externalModule [description]
 * @param  {String} id             [description]
 * @param  {[type]} thiss          [description]
 * @param  {Object} context        [description]
 */
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

/**
 * Loads a native / external (3rd party) module
 * @param  {String} id              module id
 * @param  {[type]} externalBinding [description]
 * @param  {Object} context         [description]
 * @return {Object}                 The exported module
 */
Module.prototype.loadExternalModule = function(id, externalBinding, context) {
	var sourceUrl = (context === undefined) ? "app://app.js" : context.sourceUrl,
		externalModule,
		returnObj;

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

// See https://nodejs.org/api/modules.html#modules_all_together

/**
 * Require another module as a child of this module.
 * This parent module's path is used as the base for relative paths
 * when loading the child. Returns the exports object
 * of the child module.
 *
 * @param  {String} request  The path to the requested module
 * @param  {Object} context  [description]
 * @return {Object}          The loaded module
 */
Module.prototype.require = function (request, context) {
	var start, // hack up the start of the string to check relative/absolute/"naked" module id
		loaded; // variable to hold the possibly loaded module...

	// 1. If X is a core module,
	loaded = this.loadCoreModule(request, context);
	if (loaded) {
		// a. return the core module
		// b. STOP
		return loaded;
	}

	// 2. If X begins with './' or '/' or '../'
	start = request.substring(0, 2);
	if (start === './' || start === '..') {
		loaded = this.loadAsFileOrDirectory(path.normalize(this.path + '/' + request), context);
		if (loaded) {
			return loaded;
		}
	// Root/absolute path (internally when reading the file, we prepend "Resources/" as root dir)
	} else if (request.substring(0, 1) === '/') {
		loaded = this.loadAsFileOrDirectory(path.normalize(request), context);
		if (loaded) {
			return loaded;
		}
	} else {
		// Look for CommonJS module
		if (request.indexOf('/') == -1) {
			// For CommonJS we need to look for module.id/module.id.js first...
			// TODO Only look for this _exact file_. DO NOT APPEND .js or .json to it!
			loaded = this.loadAsFile('/' + request + '/' + request + '.js', context);
			if (loaded) {
				return loaded;
			}
			// Then try module.id as directory
			loaded = this.loadAsDirectory('/' + request, context);
			if (loaded) {
				return loaded;
			}
		}

		// Allow looking through node_modules
		// 3. LOAD_NODE_MODULES(X, dirname(Y))
		loaded = this.loadNodeModules(request, this.path, context);
		if (loaded) {
			return loaded;
		}

		// Fallback to old Titanium behavior of assuming it's actually an absolute path

		// We'd like to warn users about legacy style require syntax so they can update, but the new syntax is not backwards compatible.
		// So for now, let's just be quite about it. In future versions of the SDK (7.0?) we should warn (once 5.x is end of life so backwards compat is not necessary)
		//kroll.log(TAG, "require called with un-prefixed module id: " + request + ", should be a core or CommonJS module. Falling back to old Ti behavior and assuming it's an absolute path: /" + request);

		loaded = this.loadAsFileOrDirectory(path.normalize('/' + request), context);
		if (loaded) {
			return loaded;
		}
	}

	// 4. THROW "not found"
	var err = new Error("Cannot find module '" + request + "'");
	err.code = 'MODULE_NOT_FOUND';
	throw err;
}

/**
 * Loads the core module if it exists. If not, returns null.
 *
 * @param  {String}  id The request module id
 * @param  {Object}  context The context object
 * @return {Object}    true if the module id matches a native or CommonJS module id, (or it's first path segment does).
 */
Module.prototype.loadCoreModule = function (id, context) {
	var wrapper = this.wrapperCache[id],
		parts,
		externalBinding,
		externalCommonJsContents;
	// check if we have a cached copy of the wrapper
	if (wrapper) {
		return wrapper;
	}

	parts = id.split('/');
	externalBinding = kroll.externalBinding(parts[0]);

	if (externalBinding) {
		if (parts.length === 1) {
			// This is the "root" of an external module. It can look like:
			// request("com.example.mymodule")
			// We can load and return it right away (caching occurs in the called function).
			return this.loadExternalModule(parts[0], externalBinding, context);
		}

		// Could be a sub-module (CommonJS) of an external native module.
		// We allow that since TIMOB-9730.
		if (kroll.isExternalCommonJsModule(parts[0])) {
			externalCommonJsContents = kroll.getExternalCommonJsModule(id);
			if (externalCommonJsContents) {
				// found it
				// FIXME Re-use loadAsJavaScriptText?
				var module = new Module(id, this, context);
				Module.cache[id] = module;
				module.load(id, externalCommonJsContents);
				return module.exports;
			}
		}
	}

	return null; // failed to load
}

/**
 * Attempts to load a node module by id from the starting path
 * @param  {String} moduleId       The path of the module to load.
 * @param  {String} startDir       The starting directory
 * @param  {Object} context        [description]
 * @return {Object}                The module's exports, if loaded. null if not.
 */
Module.prototype.loadNodeModules = function (moduleId, startDir, context) {
	var mod, // the loaded module
		dirs = [],
		i,
		dir;

	// 1. let DIRS=NODE_MODULES_PATHS(START)
	dirs = this.nodeModulesPaths(startDir);
	// 2. for each DIR in DIRS:
	for (i = 0; i < dirs.length; i++)
	{
		dir = dirs[i];
		// a. LOAD_AS_FILE(DIR/X)
		// b. LOAD_AS_DIRECTORY(DIR/X)
		mod = this.loadAsFileOrDirectory(path.join(dir, moduleId), context);
		if (mod) {
			return mod;
		}
	}
	return null;
}

/**
 * Determine the set of paths to search for node_modules
 * @param  {String} startDir       The starting directory
 * @return {[String]}              The array of paths to search
 */
Module.prototype.nodeModulesPaths = function (startDir) {
	// 1. let PARTS = path split(START)
	var parts = startDir.split('/'),
		// 2. let I = count of PARTS - 1
		i = parts.length - 1,
		// 3. let DIRS = []
		dirs = [],
		dir;

	// 4. while I >= 0,
	while (i >= 0) {
		// a. if PARTS[I] = "node_modules" CONTINUE
		if (parts[i] === 'node_modules') {
			continue;
		}
		// b. DIR = path join(PARTS[0 .. I] + "node_modules")
		dir = path.join(parts.slice(0, i + 1).join('/'), 'node_modules');
		// c. DIRS = DIRS + DIR
		dirs.push(dir);
		// d. let I = I - 1
		i = i - 1;
	}
	return dirs;
}

/**
 * Attempts to load a given path as a file or directory.
 * @param  {String} normalizedPath The path of the module to load.
 * @param  {Object} context        [description]
 * @return {Object}                The module's exports, if loaded. null if not.
 */
Module.prototype.loadAsFileOrDirectory = function (normalizedPath, context) {
	// a. LOAD_AS_FILE(Y + X)
	var loaded = this.loadAsFile(normalizedPath, context);
	if (loaded) {
		return loaded;
	}
	// b. LOAD_AS_DIRECTORY(Y + X)
	loaded = this.loadAsDirectory(normalizedPath, context);
	if (loaded) {
		return loaded;
	}

	return null;
}

/**
 * Loads a given file as a Javascript file, returning the module.exports.
 * @param  {String} filename File we're attempting to load
 * @param  {Object} context
 * @return {Object}          module.exports of the file.
 */
Module.prototype.loadJavascriptText = function (filename, context) {
	var module;

	// Look in the cache!
	if (Module.cache[filename]) {
		return Module.cache[filename].exports;
	}

	module = new Module(filename, this, context);
	module.load(filename);

	return module.exports;
}

/**
 * Loads a JSON file by reading it's contents, doing a JSON.parse and returning the parsed object.
 *
 * @param  {String} filename File we're attempting to load
 * @param  {Object} context
 * @return {Object}          The parsed JSON object from the file
 */
Module.prototype.loadJavascriptObject = function (filename, context) {
	var module,
		source;

	// Look in the cache!
	if (Module.cache[filename]) {
		return Module.cache[filename].exports;
	}

	module = new Module(filename, this, context);
	module.filename = filename;
	module.path = path.dirname(filename);
	source = assets.readAsset('Resources' + filename); // Assumes Resources/!

	// Stick it in the cache
	Module.cache[filename] = module;

	module.exports = JSON.parse(source);
	module.loaded = true;

	return module.exports;
}

/**
 * Attempts to load a file by it's full filename according to NodeJS rules.
 *
 * @param  {String} id The filename
 * @param  {Object} context
 * @return {Object}    String for Javascript text, Object for JSON file, null if not found.
 */
Module.prototype.loadAsFile = function (id, context) {
	// 1. If X is a file, load X as JavaScript text.  STOP
	var filename = id;
	if (this.filenameExists(filename)) {
		// If the file has a .json extension, load as JavascriptObject
		if (filename.length > 5 && filename.slice(-4) === 'json') {
			return this.loadJavascriptObject(filename, context);
		}
		return this.loadJavascriptText(filename, context);
	}
	// 2. If X.js is a file, load X.js as JavaScript text.  STOP
	filename = id + '.js';
	if (this.filenameExists(filename)) {
		return this.loadJavascriptText(filename, context);
	}
	// 3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
	filename = id + '.json';
	if (this.filenameExists(filename)) {
		return this.loadJavascriptObject(filename, context);
	}
	// failed to load anything!
	return null;
}

/**
 * Attempts to load a directory according to NodeJS rules.
 *
 * @param  {String} id The directory name
 * @param  {Object} context
 * @return {Object}    String for Javascript text, Object for JSON file, null if not found.
 */
Module.prototype.loadAsDirectory = function (id, context) {
	// 1. If X/package.json is a file,
	var filename = path.resolve(id, 'package.json');
	if (this.filenameExists(filename)) {
		// a. Parse X/package.json, and look for "main" field.
		var object = this.loadJavascriptObject(filename, context);
		if (object && object.main) {
			// b. let M = X + (json main field)
			var m = path.resolve(id, object.main);
			// c. LOAD_AS_FILE(M)
			return this.loadAsFile(m, context);
		}
	}

	// 2. If X/index.js is a file, load X/index.js as JavaScript text.  STOP
	filename = path.resolve(id, 'index.js');
	if (this.filenameExists(filename)) {
		return this.loadJavascriptText(filename, context);
	}
	// 3. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
	filename = path.resolve(id, 'index.json');
	if (this.filenameExists(filename)) {
		return this.loadJavascriptObject(filename, context);
	}

	return null;
}

/**
 * Setup a sandbox and run the module's script inside it.
 * Returns the result of the executed script.
 * @param  {String} source   [description]
 * @param  {String} filename [description]
 * @return {[type]}          [description]
 */
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

/**
 * The loaded index.json file from the app. Used to store the encrypted JS assets'
 * filenames/offsets.
 */
var fileIndex;

/**
 * Look up a filename in the app's index.json file
 * @param  {String} filename the file we're looking for
 * @return {Boolean}         true if the filename exists in the index.json
 */
Module.prototype.filenameExists = function (filename) {
	filename = 'Resources' + filename; // When we actually look for files, assume "Resources/" is the root
	if (!fileIndex) {
		var json = assets.readAsset('index.json');
		fileIndex = JSON.parse(json);
	}

	return filename in fileIndex;
}
