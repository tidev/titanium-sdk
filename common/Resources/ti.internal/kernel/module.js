/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_IOS, OS_ANDROID */
import path from '../extensions/node/path';
import invoker from './android/invoker';

function bootstrap (global, kroll) {
	const assets = kroll.binding('assets');
	const Script = OS_ANDROID ? kroll.binding('evals').Script : kroll.binding('Script');

	/**
	 * The loaded index.json file from the app. Used to store the encrypted JS assets'
	 * filenames/offsets.
	 */
	let fileIndex;
	// FIXME: fix file name parity between platforms
	const INDEX_JSON = OS_ANDROID ? 'index.json' : '/_index_.json';

	class Module {
		/**
		 * [Module description]
		 * @param {string} id      module id
		 * @param {Module} parent  parent module
		 */
		constructor(id, parent) {
			this.id = id;
			this.exports = {};
			this.parent = parent;

			this.filename = null;
			this.loaded = false;
			this.wrapperCache = {};
			this.isService = false; // toggled on if this module is the service entry point
		}

		/**
		 * Attempts to load the module. If no file is found
		 * with the provided name an exception will be thrown.
		 * Once the contents of the file are read, it is run
		 * in the current context. A sandbox is created by
		 * executing the code inside a wrapper function.
		 * This provides a speed boost vs creating a new context.
		 *
		 * @param  {String} filename [description]
		 * @param  {String} source   [description]
		 * @returns {void}
		 */
		load (filename, source) {
			if (this.loaded) {
				throw new Error('Module already loaded.');
			}

			this.filename = filename;
			this.path = path.dirname(filename);
			this.paths = this.nodeModulesPaths(this.path);

			if (!source) {
				source = assets.readAsset(OS_ANDROID ? `Resources${filename}` : filename);
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
		 * @param  {object} externalModule native module proxy
		 * @param  {string} sourceUrl      the current js file url
		 * @return {object}                wrapper around the externalModule
		 */
		createModuleWrapper (externalModule, sourceUrl) {
			if (OS_IOS) {
				// iOS does not need a module wrapper, return original external module
				return externalModule;
			}

			// The module wrapper forwards on using the original as a prototype
			function ModuleWrapper() {}
			ModuleWrapper.prototype = externalModule;

			const wrapper = new ModuleWrapper();
			// Here we take the APIs defined in the bootstrap.js
			// and effectively lazily hook them
			// We explicitly guard the code so iOS doesn't even use/include the referenced invoker.js import
			const invocationAPIs = externalModule.invocationAPIs || [];
			for (const api of invocationAPIs) {
				const delegate = externalModule[api];
				if (!delegate) {
					continue;
				}

				wrapper[api] = invoker.createInvoker(externalModule, delegate, new kroll.ScopeVars({ sourceUrl }));
			}

			wrapper.addEventListener = function (...args) {
				externalModule.addEventListener.apply(externalModule, args);
			};

			wrapper.removeEventListener = function (...args) {
				externalModule.removeEventListener.apply(externalModule, args);
			};

			wrapper.fireEvent = function (...args) {
				externalModule.fireEvent.apply(externalModule, args);
			};

			return wrapper;
		}

		/**
		 * Takes a CommonJS module and uses it to extend an existing external/native module. The exports are added to the external module.
		 * @param  {Object} externalModule The external/native module we're extending
		 * @param  {String} id             module id
		 */
		extendModuleWithCommonJs(externalModule, id) {
			if (!kroll.isExternalCommonJsModule(id)) {
				return;
			}

			// Load under fake name, or the commonjs side of the native module gets cached in place of the native module!
			// See TIMOB-24932
			const fakeId = `${id}.commonjs`;
			const jsModule = new Module(fakeId, this);
			jsModule.load(fakeId, kroll.getExternalCommonJsModule(id));
			if (jsModule.exports) {
				console.trace(`Extending native module '${id}' with the CommonJS module that was packaged with it.`);
				kroll.extend(externalModule, jsModule.exports);
			}
		}

		/**
		 * Loads a native / external (3rd party) module
		 * @param  {String} id              module id
		 * @param  {object} externalBinding external binding object
		 * @return {Object}                 The exported module
		 */
		loadExternalModule (id, externalBinding) {
			// try to get the cached module...
			let externalModule = Module.cache[id];
			if (!externalModule) {
				// iOS and Android differ quite a bit here.
				// With ios, we should already have the native module loaded
				// There's no special "bootstrap.js" file packaged within it
				// On Android, we load a bootstrap.js bundled with the module
				if (OS_IOS) {
					externalModule = externalBinding;
				} else if (OS_ANDROID) {
					// This is the process for Android, first grab the bootstrap source
					const source = externalBinding.bootstrap;

					// Load the native module's bootstrap JS
					const module = new Module(id, this);
					module.load(`${id}/bootstrap.js`, source);

					// Bootstrap and load the module using the native bindings
					const result = module.exports.bootstrap(externalBinding);

					// Cache the external module instance after it's been modified by it's bootstrap script
					externalModule = result;
				}
			}

			if (!externalModule) {
				console.trace(`Unable to load external module: ${id}`);
				return null;
			}

			// cache the loaded native module (before we extend it)
			Module.cache[id] = externalModule;

			// We cache each context-specific module wrapper
			// on the parent module, rather than in the Module.cache
			let wrapper = this.wrapperCache[id];
			if (wrapper) {
				return wrapper;
			}

			const sourceUrl = `app://${this.filename}`; // FIXME: If this.filename starts with '/', we need to drop it, I think?
			wrapper = this.createModuleWrapper(externalModule, sourceUrl);

			// Then we "extend" the API/module using any shipped JS code (assets/<module.id>.js)
			this.extendModuleWithCommonJs(wrapper, id);
			this.wrapperCache[id] = wrapper;
			return wrapper;
		}

		// See https://nodejs.org/api/modules.html#modules_all_together

		/**
		 * Require another module as a child of this module.
		 * This parent module's path is used as the base for relative paths
		 * when loading the child. Returns the exports object
		 * of the child module.
		 *
		 * @param  {String} request  The path to the requested module
		 * @return {Object}          The loaded module
		 */
		require (request) {
			// 2. If X begins with './' or '/' or '../'
			const start = request.substring(0, 2); // hack up the start of the string to check relative/absolute/"naked" module id
			if (start === './' || start === '..') {
				const loaded = this.loadAsFileOrDirectory(path.normalize(this.path + '/' + request));
				if (loaded) {
					return loaded.exports;
				}
			// Root/absolute path (internally when reading the file, we prepend "Resources/" as root dir)
			} else if (request.substring(0, 1) === '/') {
				const loaded = this.loadAsFileOrDirectory(path.normalize(request));
				if (loaded) {
					return loaded.exports;
				}
			} else {
				// Despite being step 1 in Node.JS psuedo-code, we moved it down here because we don't allow native modules
				// to start with './', '..' or '/' - so this avoids a lot of misses on requires starting that way

				// 1. If X is a core module,
				let loaded = this.loadCoreModule(request);
				if (loaded) {
					// a. return the core module
					// b. STOP
					return loaded;
				}

				// Look for CommonJS module
				if (request.indexOf('/') === -1) {
					// For CommonJS we need to look for module.id/module.id.js first...
					const filename = `/${request}/${request}.js`;
					// Only look for this _exact file_. DO NOT APPEND .js or .json to it!
					if (this.filenameExists(filename)) {
						loaded = this.loadJavascriptText(filename);
						if (loaded) {
							return loaded.exports;
						}
					}

					// Then try module.id as directory
					loaded = this.loadAsDirectory(`/${request}`);
					if (loaded) {
						return loaded.exports;
					}
				}

				// Allow looking through node_modules
				// 3. LOAD_NODE_MODULES(X, dirname(Y))
				loaded = this.loadNodeModules(request, this.paths);
				if (loaded) {
					return loaded.exports;
				}

				// Fallback to old Titanium behavior of assuming it's actually an absolute path

				// We'd like to warn users about legacy style require syntax so they can update, but the new syntax is not backwards compatible.
				// So for now, let's just be quite about it. In future versions of the SDK (7.0?) we should warn (once 5.x is end of life so backwards compat is not necessary)
				// eslint-disable-next-line max-len
				// console.warn(`require called with un-prefixed module id: ${request}, should be a core or CommonJS module. Falling back to old Ti behavior and assuming it's an absolute path: /${request}`);

				loaded = this.loadAsFileOrDirectory(path.normalize(`/${request}`));
				if (loaded) {
					return loaded.exports;
				}
			}

			// 4. THROW "not found"
			throw new Error(`Requested module not found: ${request}`); // TODO Set 'code' property to 'MODULE_NOT_FOUND' to match Node?
		}

		/**
		 * Loads the core module if it exists. If not, returns null.
		 *
		 * @param  {String}  id The request module id
		 * @return {Object}    true if the module id matches a native or CommonJS module id, (or it's first path segment does).
		 */
		loadCoreModule (id) {
			// skip bad ids, relative ids, absolute ids. "native"/"core" modules should be of form "module.id" or "module.id/sub.file.js"
			if (!id || id.startsWith('.') || id.startsWith('/')) {
				return null;
			}

			// check if we have a cached copy of the wrapper
			if (this.wrapperCache[id]) {
				return this.wrapperCache[id];
			}

			const parts = id.split('/');
			const externalBinding = kroll.externalBinding(parts[0]);
			if (externalBinding) {
				if (parts.length === 1) {
					// This is the "root" of an external module. It can look like:
					// request("com.example.mymodule")
					// We can load and return it right away (caching occurs in the called function).
					return this.loadExternalModule(parts[0], externalBinding);
				}

				// Could be a sub-module (CommonJS) of an external native module.
				// We allow that since TIMOB-9730.
				if (kroll.isExternalCommonJsModule(parts[0])) {
					const externalCommonJsContents = kroll.getExternalCommonJsModule(id);
					if (externalCommonJsContents) {
						// found it
						// FIXME Re-use loadAsJavaScriptText?
						const module = new Module(id, this);
						module.load(id, externalCommonJsContents);
						return module.exports;
					}
				}
			}

			return null; // failed to load
		}

		/**
		 * Attempts to load a node module by id from the starting path
		 * @param  {string} moduleId       The path of the module to load.
		 * @param  {string[]} dirs       paths to search
		 * @return {Module|null}      The module, if loaded. null if not.
		 */
		loadNodeModules (moduleId, dirs) {
			// 2. for each DIR in DIRS:
			for (const dir of dirs) {
				// a. LOAD_AS_FILE(DIR/X)
				// b. LOAD_AS_DIRECTORY(DIR/X)
				const mod = this.loadAsFileOrDirectory(path.join(dir, moduleId));
				if (mod) {
					return mod;
				}
			}
			return null;
		}

		/**
		 * Determine the set of paths to search for node_modules
		 * @param  {string} startDir       The starting directory
		 * @return {string[]}              The array of paths to search
		 */
		nodeModulesPaths (startDir) {
			// Make sure we have an absolute path to start with
			startDir = path.resolve(startDir);

			// Return early if we are at root, this avoids doing a pointless loop
			// and also returning an array with duplicate entries
			// e.g. ["/node_modules", "/node_modules"]
			if (startDir === '/') {
				return [ '/node_modules' ];
			}
			// 1. let PARTS = path split(START)
			const parts = startDir.split('/');
			// 2. let I = count of PARTS - 1
			let i = parts.length - 1;
			// 3. let DIRS = []
			const dirs = [];

			// 4. while I >= 0,
			while (i >= 0) {
				// a. if PARTS[I] = "node_modules" CONTINUE
				if (parts[i] === 'node_modules' || parts[i] === '') {
					i -= 1;
					continue;
				}
				// b. DIR = path join(PARTS[0 .. I] + "node_modules")
				const dir = path.join(parts.slice(0, i + 1).join('/'), 'node_modules');
				// c. DIRS = DIRS + DIR
				dirs.push(dir);
				// d. let I = I - 1
				i -= 1;
			}
			// Always add /node_modules to the search path
			dirs.push('/node_modules');
			return dirs;
		}

		/**
		 * Attempts to load a given path as a file or directory.
		 * @param  {string} normalizedPath The path of the module to load.
		 * @return {Module|null} The loaded module. null if unable to load.
		 */
		loadAsFileOrDirectory (normalizedPath) {
			// a. LOAD_AS_FILE(Y + X)
			let loaded = this.loadAsFile(normalizedPath);
			if (loaded) {
				return loaded;
			}
			// b. LOAD_AS_DIRECTORY(Y + X)
			loaded = this.loadAsDirectory(normalizedPath);
			if (loaded) {
				return loaded;
			}

			return null;
		}

		/**
		 * Loads a given file as a Javascript file, returning the module.exports.
		 * @param  {string} filename File we're attempting to load
		 * @return {Module} the loaded module
		 */
		loadJavascriptText (filename) {
			// Look in the cache!
			if (Module.cache[filename]) {
				return Module.cache[filename];
			}

			const module = new Module(filename, this);
			module.load(filename);

			return module;
		}

		/**
		 * Loads a JSON file by reading it's contents, doing a JSON.parse and returning the parsed object.
		 *
		 * @param  {String} filename File we're attempting to load
		 * @return {Module} The loaded module instance
		 */
		loadJavascriptObject (filename) {
			// Look in the cache!
			if (Module.cache[filename]) {
				return Module.cache[filename];
			}

			const module = new Module(filename, this);
			module.filename = filename;
			module.path = path.dirname(filename);
			const source = assets.readAsset(OS_ANDROID ? `Resources${filename}` : filename);

			// Stick it in the cache
			Module.cache[filename] = module;

			module.exports = JSON.parse(source);
			module.loaded = true;

			return module;
		}

		/**
		 * Attempts to load a file by it's full filename according to NodeJS rules.
		 *
		 * @param  {string} id The filename
		 * @return {Module|null} Module instance if loaded, null if not found.
		 */
		loadAsFile (id) {
			// 1. If X is a file, load X as JavaScript text.  STOP
			let filename = id;
			if (this.filenameExists(filename)) {
				// If the file has a .json extension, load as JavascriptObject
				if (filename.length > 5 && filename.slice(-4) === 'json') {
					return this.loadJavascriptObject(filename);
				}
				return this.loadJavascriptText(filename);
			}
			// 2. If X.js is a file, load X.js as JavaScript text.  STOP
			filename = id + '.js';
			if (this.filenameExists(filename)) {
				return this.loadJavascriptText(filename);
			}
			// 3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
			filename = id + '.json';
			if (this.filenameExists(filename)) {
				return this.loadJavascriptObject(filename);
			}
			// failed to load anything!
			return null;
		}

		/**
		 * Attempts to load a directory according to NodeJS rules.
		 *
		 * @param  {string} id The directory name
		 * @return {Module|null} Loaded module, null if not found.
		 */
		loadAsDirectory (id) {
			// 1. If X/package.json is a file,
			let filename = path.resolve(id, 'package.json');
			if (this.filenameExists(filename)) {
				// a. Parse X/package.json, and look for "main" field.
				const object = this.loadJavascriptObject(filename);
				if (object && object.exports && object.exports.main) {
					// b. let M = X + (json main field)
					const m = path.resolve(id, object.exports.main);
					// c. LOAD_AS_FILE(M)
					return this.loadAsFileOrDirectory(m);
				}
			}

			// 2. If X/index.js is a file, load X/index.js as JavaScript text.  STOP
			filename = path.resolve(id, 'index.js');
			if (this.filenameExists(filename)) {
				return this.loadJavascriptText(filename);
			}
			// 3. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
			filename = path.resolve(id, 'index.json');
			if (this.filenameExists(filename)) {
				return this.loadJavascriptObject(filename);
			}

			return null;
		}

		/**
		 * Setup a sandbox and run the module's script inside it.
		 * Returns the result of the executed script.
		 * @param  {String} source   [description]
		 * @param  {String} filename [description]
		 * @return {*}          [description]
		 */
		_runScript (source, filename) {
			const self = this;

			function require(path) {
				return self.require(path);
			}
			require.main = Module.main;

			// This "first time" run is really only for app.js, AFAICT, and needs
			// an activity. If app was restarted for Service only, we don't want
			// to go this route. So added currentActivity check. (bill)
			if (self.id === '.' && !this.isService) {
				global.require = require;

				// check if we have an inspector binding...
				const inspector = kroll.binding('inspector');
				if (inspector) {
					// If debugger is enabled, load app.js and pause right before we execute it
					const inspectorWrapper = inspector.callAndPauseOnStart;
					if (inspectorWrapper) {
						// FIXME Why can't we do normal Module.wrap(source) here?
						// I get "Uncaught TypeError: Cannot read property 'createTabGroup' of undefined" for "Ti.UI.createTabGroup();"
						// Not sure why app.js is special case and can't be run under normal self-invoking wrapping function that gets passed in global/kroll/Ti/etc
						// Instead, let's use a slightly modified version of callAndPauseOnStart:
						// It will compile the source as-is, schedule a pause and then run the source.
						return inspectorWrapper(source, filename);
					}
				}
				// run app.js "normally" (i.e. not under debugger/inspector)
				return Script.runInThisContext(source, filename, true);
			}

			// In V8, we treat external modules the same as native modules.  First, we wrap the
			// module code and then run it in the current context.  This will allow external modules to
			// access globals as mentioned in TIMOB-11752. This will also help resolve startup slowness that
			// occurs as a result of creating a new context during startup in TIMOB-12286.
			source = Module.wrap(source);

			const f = Script.runInThisContext(source, filename, true);
			return f(this.exports, require, this, filename, path.dirname(filename), Titanium, Ti, global, kroll);
		}

		/**
		 * Look up a filename in the app's index.json file
		 * @param  {String} filename the file we're looking for
		 * @return {Boolean}         true if the filename exists in the index.json
		 */
		filenameExists (filename) {
			filename = 'Resources' + filename; // When we actually look for files, assume "Resources/" is the root
			if (!fileIndex) {
				const json = assets.readAsset(INDEX_JSON);
				fileIndex = JSON.parse(json);
			}

			return fileIndex && filename in fileIndex;
		}
	}

	Module.cache = [];
	Module.main = null;
	Module.wrapper = [
		'(function (exports, require, module, __filename, __dirname, Titanium, Ti, global, kroll) {',
		'\n});'
	];
	Module.wrap = function (script) {
		return Module.wrapper[0] + script + Module.wrapper[1];
	};

	/**
	 * [runModule description]
	 * @param  {String} source            JS Source code
	 * @param  {String} filename          Filename of the module
	 * @param  {Titanium.Service|null|Titanium.Android.Activity} activityOrService [description]
	 * @return {Module}                   The loaded Module
	 */
	Module.runModule = function (source, filename, activityOrService) {
		let id = filename;
		if (!Module.main) {
			id = '.';
		}

		const module = new Module(id, null);
		// FIXME: I don't know why instanceof for Titanium.Service works here!
		// On Android, it's an apiname of Ti.Android.Service
		// On iOS, we don't yet pass in the value, but we do set Ti.App.currentService property beforehand!
		// Can we remove the preload stuff in KrollBridge.m to pass along the service instance into this like we do on Andorid?
		module.isService = OS_ANDROID ? (activityOrService instanceof Titanium.Service) : Ti.App.currentService !== null;
		if (OS_ANDROID) {
			if (module.isService) {
				Object.defineProperty(Ti.Android, 'currentService', {
					value: activityOrService,
					writable: false,
					configurable: true
				});
			} else {
				Object.defineProperty(Ti.Android, 'currentService', {
					value: null,
					writable: false,
					configurable: true
				});
			}
		}

		if (!Module.main) {
			Module.main = module;
		}
		filename = filename.replace('Resources/', '/'); // normalize back to absolute paths (which really are relative to Resources under the hood)
		module.load(filename, source);

		if (OS_ANDROID) {
			Object.defineProperty(Ti.Android, 'currentService', {
				value: null,
				writable: false,
				configurable: true
			});
		}
		return module;
	};
	return Module;
}

export default bootstrap;
