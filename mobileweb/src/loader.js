/**
 * This file contains source code from the following:
 *
 * Dojo Toolkit
 * Copyright (c) 2005-2011, The Dojo Foundation
 * New BSD License
 * <http://dojotoolkit.org>
 *
 * require.js
 * Copyright (c) 2010-2011, The Dojo Foundation
 * New BSD License / MIT License
 * <http://requirejs.org>
 * 
 * curl.js
 * Copyright (c) 2011 unscriptable.com / John Hann
 * MIT License
 * <https://github.com/unscriptable/curl>
 */

(function(global) {

	"use strict";

	var // misc variables
		x,
		odp,
		doc = global.document,
		el = doc.createElement("div"),

		// cached useful regexes
		commentRegExp = /(\/\*([\s\S]*?)\*\/|\/\/(.*)$)/mg,
		cjsRequireRegExp = /[^.]require\(\s*["']([^'"\s]+)["']\s*\)/g,
		reservedModuleIdsRegExp = /exports|module/,

		// the global config settings
		cfg = global.require || {},

		// shortened packagePaths variable
		pp = cfg.packagePaths || {},

		// the number of seconds to wait for a script to load before timing out
		waitSeconds = (cfg.waitSeconds || 7) * 1000,

		baseUrl = cfg.baseUrl || "./",

		// CommonJS paths
		paths = cfg.paths || {},

		// feature detection results initialize by pre-calculated tests
		hasCache = cfg.hasCache || {},

		// a queue of module definitions to evaluate once a module has loaded
		defQ = [],

		// map of module ids to functions containing an entire module, which could
		// include multiple defines. when a dependency is not defined, the loader
		// will check the cache to see if it exists first before fetching from the
		// server. this is used when the build system bundles modules into the
		// minified javascript files.
		defCache = {},

		// map of package names to package resource definitions
		packages = {},

		// map of module ids to module resource definitions that are being loaded and processed
		waiting = {},

		// map of module ids to module resource definitions
		modules = {},

		// mixin of common functions
		fnMixin;

	/******************************************************************************
	 * Utility functions
	 *****************************************************************************/

	function _mix(dest, src) {
		for (var p in src) {
			src.hasOwnProperty(p) && (dest[p] = src[p]);
		}
		return dest;
	}

	function mix(dest) {
		// summary:
		//		Copies properties by reference from a source object to a destination
		//		object, then returns the destination object. To be clear, this will
		//		modify the dest being passed in.
		var i = 1;
		dest || (dest = {});
		while (i < arguments.length) {
			_mix(dest, arguments[i++]);
		}
		return dest;
	}

	function each(a, fn) {
		// summary:
		//		Loops through each element of an array and passes it to a callback
		//		function.
		var i = 0,
			l = (a && a.length) || 0,
			args = Array.prototype.slice.call(arguments, 0);
		args.shift();
		while (i < l) {
			args[0] = a[i++];
			fn.apply(null, args);
		}
	}

	function is(it, type) {
		// summary:
		//		Tests if "it" is a specific "type". If type is omitted, then
		//		it will return the type.
		//
		// returns:
		//		Boolean if type is passed in
		//		String of type if type is not passed in
		var t = it === undefined ? "" : ({}).toString.call(it),
			m = t.match(/^\[object (.+)\]$/),
			v = m ? m[1] : "Undefined";
		return type ? type === v : v;
	}
	
	function isDef(it) {
		// summary:
		//		Helper function that tests if "it" is defined
		//
		// returns:
		//		Boolean
		return !is(it, "Undefined");
	}

	function isEmpty(it) {
		// summary:
		//		Checks if an object is empty.
		var p;
		for (p in it) {
			break;
		}
		return !it || (!it.call && !p);
	}

	function evaluate(code, sandboxVariables, globally) {
		// summary:
		//		Evaluates code globally or in a sandbox.
		//
		// code: String
		//		The code to evaluate
		//
		// sandboxVariables: Object?
		//		When "globally" is false, an object of names => values to initialize in
		//		the sandbox. The variable names must NOT contain '-' characters.
		//
		// globally: Boolean?
		//		When true, evaluates the code in the global namespace, generally "window".
		//		If false, then it will evaluate the code in a sandbox.

		var i,
			vars = [],
			vals = [],
			r;

		if (globally) {
			r = global.eval(code);
		} else {
			for (i in sandboxVariables) {
				vars.push(i + "=__vars." + i);
				vals.push(i + ":" + i);
			}
			r = (new Function("__vars", (vars.length ? "var " + vars.join(',') + ";\n" : "") + code + "\n;return {" + vals.join(',') + "};"))(sandboxVariables);
		}

		// if the last line of a module is a console.*() call, Firebug for some reason
		// sometimes returns "_firebugIgnore" instead of undefined or null
		return r === "_firebugIgnore" ? null : r;
	}

	function compactPath(path) {
		var result = [],
			segment,
			lastSegment;
		path = path.replace(/\\/g, '/').split('/');
		while (path.length) {
			segment = path.shift();
			if (segment === ".." && result.length && lastSegment !== "..") {
				result.pop();
				lastSegment = result[result.length - 1];
			} else if (segment !== ".") {
				result.push(lastSegment = segment);
			}
		}
		return result.join("/");
	}

	/******************************************************************************
	 * has() feature detection
	 *****************************************************************************/

	function has(name) {
		// summary:
		//		Determines of a specific feature is supported.
		//
		// name: String
		//		The name of the test.
		//
		// returns: Boolean (truthy/falsey)
		//		Whether or not the feature has been detected.

		if (is(hasCache[name], "Function")) {
			hasCache[name] = hasCache[name](global, doc, el);
		}
		return hasCache[name];
	}

	has.add = function(name, test, now, force){
		// summary:
		//		Adds a feature test.
		//
		// name: String
		//		The name of the test.
		//
		// test: Function
		//		The function that tests for a feature.
		//
		// now: Boolean?
		//		If true, runs the test immediately.
		//
		// force: Boolean?
		//		If true, forces the test to override an existing test.

		if (hasCache[name] === undefined || force) {
			hasCache[name] = test;
		}
		return now && has(name);
	};

	/******************************************************************************
	 * Event handling
	 *****************************************************************************/

	function on(target, type, context, listener) {
		// summary:
		//		Connects a listener to an event on the specified target.
		//
		// target: Object|DomNode
		//		The target to add the event listener to.
		//
		// type: String
		//		The event to listen for.
		//
		// context: Object|Function
		//		When listener is defined, the context is the scope in which the listener
		//		is executed.
		//
		// listener: Function?|String?
		//		Optional. When present, the context is used as the scope.
		//
		// example:
		//		Attaching to a click event:
		//		|	on(myButton, "click", function() {
		//		|		alert("Howdy!");
		//		|	});
		//
		// example:
		//		Attaching to a click event within a declared class method:
		//		|	...
		//		|	constructor: function() {
		//		|		require.on(myButton, "click", this, "onButtonClick");
		//		|	},
		//		|	onButtonClick: function() {
		//		|		alert("Howdy from " + this.declaredClass + "!");
		//		|	}
		//		|	...
		//
		// example:
		//		Attaching to a click event with an anonymous function in a declared class:
		//		|	...
		//		|	constructor: function() {
		//		|		require.on(myButton, "click", this, function() {
		//		|			alert("Howdy from " + this.declaredClass + "!");
		//		|		});
		//		|	}
		//		|	...

		var cb = is(listener, "Function") ? function() {
			return listener.apply(context, arguments);
		} : is(listener, "String") ? function() {
			return context[listener].apply(context, arguments);
		} : context;

		target.addEventListener(type, cb, false);
		return function() {
			target.removeEventListener(type, cb, false);
		};
	}

	on.once = function(target, type, listener) {
		var h = on(target, type, function() {
			h && h(); // do the disconnect
			return listener.apply(this, arguments);
		});
		return h;
	};

	/******************************************************************************
	 * Configuration processing
	 *****************************************************************************/

	// make sure baseUrl ends with a slash
	if (!/\/$/.test(baseUrl)) {
		baseUrl += "/";
	}

	function configPackage(/*String|Object*/pkg, /*String?*/dir) {
		// summary:
		//		An internal helper function to configure a package and add it to the array
		//		of packages.
		//
		// pkg: String|Object
		//		The name of the package (if a string) or an object containing at a minimum
		//		the package's name, but possibly also the package's location and main
		//		source file
		//
		// dir: String?
		//		Optional. A base URL to prepend to the package location

		pkg = pkg.name ? pkg : { name: pkg };
		pkg.location = (/(^\/)|(\:)/.test(dir) ? dir : "") + (pkg.location || pkg.name);
		pkg.main = (pkg.main || "main").replace(/(^\.\/)|(\.js$)/, "");
		packages[pkg.name] = pkg;
	}

	// first init all packages from the config
	each(cfg.packages, configPackage);

	// second init all package paths and their packages from the config
	for (x in pp) {
		each(pp[x], configPackage, x + "/");
	}

	// run all feature detection tests
	for (x in cfg.has) {
		has.add(x, cfg.has[x], 0, true);
	}

	/******************************************************************************
	 * Module functionality
	 *****************************************************************************/

	function ResourceDef(name, refModule, deps, rawDef) {
		// summary:
		//		A resource definition that describes a file or module being loaded.
		//
		// description:
		//		A resource is anything that is "required" such as applications calling
		//		require() or a define() with dependencies.
		//
		//		This loader supports resources that define multiple modules, hence this
		//		object.
		//
		//		In addition, this object tracks the state of the resource (loaded,
		//		executed, etc) as well as loads a resource and executes the defintions.
		//
		// name: String
		//		The module id.
		//
		// deps: Array?
		//		An array of dependencies.
		//
		// rawDef: Object? | Function? | String?
		//		The object, function, or string that defines the resource.
		//
		// refModule: Object?
		//		A reference map used for resolving module URLs.

		var match = name && name.match(/^(.+?)\!(.*)$/),
			isRelative = /^\./.test(name),
			exports = {},
			pkg = null,
			cjs,
			_t = this;

		// name could be:
		//  - a plugin		text!/some/file.html or include!/some/file.js
		//  - a module		some/module, ../some/module
		//  - a js file		/some/file.js
		//  - a url			http://www.google.com/

		_t.name = name;
		_t.deps = deps || [];
		_t.plugin = null;
		_t.callbacks = [];

		if (!match && (/(^\/)|(\:)|(\.js$)/.test(name) || (isRelative && !refModule))) {
			_t.url = name;
		} else {
			if (match) {
				_t.plugin = _t.deps.length;
				_t.pluginArgs = match[2];
				_t.pluginCfg = cfg[match[1]];
				_t.deps.push(match[1]);
			} else if (name) {
				name = _t.name = compactPath((isRelative ? refModule.name + "/../" : "") + name);

				if (/^\./.test(name)) {
					throw new Error("Irrational path \"" + name + "\"");
				}

				// TODO: if this is a package, then we need to transform the URL into the module's path
				// MUST set pkg to anything other than null, even if this module isn't in a package
				pkg = "";

				/(^\/)|(\:)/.test(name) || (name = baseUrl + name);

				_t.url = name + ".js";
			}
		}

		_t.pkg = pkg;
		_t.rawDef = rawDef;
		_t.loaded = !!rawDef;
		_t.refModule = refModule;

		// our scoped require()
		function scopedRequire() {
			var args = Array.prototype.slice.call(arguments, 0);
			args.length > 1 || (args[1] = 0);
			args[2] = _t;
			return req.apply(null, args);
		}
		scopedRequire.toUrl = function() {
			var args = Array.prototype.slice.call(arguments, 0);
			_t.plugin === null && (args[1] = _t);
			return toUrl.apply(null, args);
		};
		mix(scopedRequire, fnMixin, {
			cache: req.cache
		});

		_t.cjs = {
			require: scopedRequire,
			exports: exports,
			module: {
				exports: exports
			}
		};
	}

	ResourceDef.prototype.load = function(sync, callback) {
		// summary:
		//		Retreives a remote script and inject it either by XHR (sync) or attaching
		//		a script tag to the DOM (async).
		//
		// sync: Boolean
		//		If true, uses XHR, otherwise uses a script tag.
		//
		// callback: Function?
		//		A function to call when sync is false and the script tag loads.

		var s,
			x,
			disconnector,
			_t = this,
			cached = defCache[_t.name],
			fireCallbacks = function() {
				each(_t.callbacks, function(c) { c(_t); });
				_t.callbacks = [];
			},
			onLoad = function(rawDef) {
				_t.loaded = 1;
				if (_t.rawDef = rawDef) {
					if (is(rawDef, "String")) {
						// if rawDef is a string, then it's either a cached string or xhr response
						if (/\.js$/.test(_t.url)) {
							rawDef = evaluate(rawDef, _t.cjs);
							_t.def = _t.rawDef = !isEmpty(rawDef.exports) ? rawDef.exports : (rawDef.module && !isEmpty(rawDef.module.exports) ? rawDef.module.exports : null);
							_t.def === null && (_t.rawDef = rawDef);
						} else {
							_t.def = rawDef;
							_t.executed = 1;
						}
					} else if (is(rawDef, "Function")) {
						// if rawDef is a function, then it's a cached module definition
						waiting[_t.name] = _t;
						rawDef();
					}
				}
				processDefQ(_t);
				fireCallbacks();
				return 1;
			};

		_t.sync = sync;
		callback && _t.callbacks.push(callback);

		// if we don't have a url, then I suppose we're loaded
		if (_t.executed || !_t.url) {
			_t.loaded = 1;
			fireCallbacks();
			return;
		}

		// if we're already waiting, then we can just return and our callback will be fired
		if (waiting[_t.name]) {
			return;
		}

		// if we're already loaded or the definition has been cached, then just return now
		if (_t.loaded || cached) {
			return onLoad(cached);
		}

		// mark this module as waiting to be loaded so that anonymous modules can be
		// identified
		waiting[_t.name] = _t;

		if (sync) {
			x = new XMLHttpRequest();
			x.open("GET", _t.url, false);
			x.send(null);

			if (x.status === 200) {
				return onLoad(x.responseText);
			} else {
				throw new Error("Failed to load module \"" + _t.name + "\": " + x.status);
			}
		} else {
			// insert the script tag, attach onload, wait
			x = _t.node = doc.createElement("script");
			x.type = "text/javascript";
			x.charset = "utf-8";
			x.async = true;

			disconnector = on(x, "load", function(e) {
				e = e || global.event;
				var node = e.target || e.srcElement;
				if (e.type === "load" || /complete|loaded/.test(node.readyState)) {
					disconnector();
					onLoad();
				}
			});

			// set the source url last
			x.src = _t.url;

			s = doc.getElementsByTagName("script")[0];
			s.parentNode.insertBefore(x, s);
		}
	};

	ResourceDef.prototype.execute = function(callback) {
		// summary:
		//		Executes the resource's rawDef which defines the module.
		//
		// callback: Function?
		//		A function to call after the module has been executed.

		var _t = this;

		if (_t.executed) {
			callback && callback();
			return;
		}

		// first need to make sure we have all the deps loaded
		fetch(_t.deps, function(deps) {
			var i,
				p,
				r = _t.rawDef,
				q = defQ.slice(0), // backup the defQ
				finish = function() {
					_t.executed = 1;
					callback && callback();
				};

			// need to wipe out the defQ
			defQ = [];

			// make sure we have ourself in the waiting queue
			//waiting[_t.name] = _t;

			_t.def = _t.def
				||	(r && (is(r, "String")
						? evaluate(r, _t.cjs)
						: is(r, "Function")
							? r.apply(null, deps)
							: is(r, "Object")
								? (function(obj, vars) {
										for (var i in vars){
											this[i] = vars[i];
										}
										return obj;
									}).call({}, r, _t.cjs)
								: null
						)
					)
				||	_t.cjs.exports;

			// we might have just executed code above that could have caused a couple
			// define()'s to queue up
			processDefQ(_t);

			// restore the defQ
			defQ = q;

			// if plugin is not null, then it's the index in the deps array of the plugin
			// to invoke
			if (_t.plugin !== null) {
				p = deps[_t.plugin];

				// the plugin's content is dynamic, so just remove from the module cache
				if (p.dynamic) {
					delete modules[_t.name];
				}

				// if the plugin has a load function, then invoke it!
				p.load && p.load(_t.pluginArgs, _t.cjs.require, function(v) {
					_t.def = v;
					finish();
				}, _t.pluginCfg);
			}

			finish();
		}, function(ex) {
			throw ex;
		}, _t.refModule, _t.sync);
	};

	function getResourceDef(name, refModule, deps, rawDef, dontCache, overrideCache) {
		// summary:
		//		Creates a new resource definition or returns an existing one from cache.

		var module = new ResourceDef(name, refModule, deps, rawDef),
			moduleName = module.name;

		if (name in module.cjs) {
			module.def = module.cjs[name];
			module.loaded = module.executed = 1;
			return module;
		}

		return dontCache || !moduleName ? module : (!modules[moduleName] || !modules[moduleName].executed || overrideCache ? (modules[moduleName] = module) : modules[moduleName]);
	}

	function processDefQ(module) {
		// summary:
		//		Executes all modules sitting in the define queue.
		//
		// description:
		//		When a resource is loaded, the remote AMD resource is fetched, it's
		//		possible that one of the define() calls was anonymous, so it should
		//		be sitting in the defQ waiting to be executed.

		var m,
			q = defQ.slice(0);
		defQ = [];

		while (q.length) {
			m = q.shift();

			// if the module is anonymous, assume this module's name
			m.name || (m.name = module.name);

			// if the module is this module, then modify this 
			if (m.name === module.name) {
				modules[m.name] = module;
				module.deps = m.deps;
				module.rawDef = m.rawDef;
				module.execute();
			} else {
				modules[m.name] = m;
				m.execute();
			}
		}

		delete waiting[module.name];
	}

	function fetch(deps, success, failure, refModule, sync) {
		// summary:
		//		Fetches all dependents and fires callback when finished or on error.
		//
		// description:
		//		The fetch() function will fetch each of the dependents either
		//		synchronously or asynchronously (default).
		//
		// deps: String | Array
		//		A string or array of module ids to load. If deps is a string, load()
		//		returns the module's definition.
		//
		// success: Function?
		//		A callback function fired once the loader successfully loads and evaluates
		//		all dependent modules. The function is passed an ordered array of
		//		dependent module definitions.
		//
		// failure: Function?
		//		A callback function fired when the loader is unable to load a module. The
		//		function is passed the exception.
		//
		// refModule: Object?
		//		A reference map used for resolving module URLs.
		//
		// sync: Boolean?
		//		Forces the async path to be sync.
		//
		// returns: Object | Function
		//		If deps is a string, then it returns the corresponding module definition,
		//		otherwise the require() function.

		var i, l, count, s = is(deps, "String");

		if (s) {
			deps = [deps];
			sync = 1;
		}

		for (i = 0, l = count = deps.length; i < l; i++) {
			deps[i] && (function(idx) {
				getResourceDef(deps[idx], refModule).load(!!sync, function(m) {
					m.execute(function() {
						deps[idx] = m.def;
						if (--count === 0) {
							success && success(deps);
							count = -1; // prevent success from being called the 2nd time below
						}
					});
				});
			}(i));
		}

		count === 0 && success && success(deps);
		return s ? deps[0] : deps;
	}

	function def(name, deps, rawDef) {
		// summary:
		//		Used to define a module and it's dependencies.
		//
		// description:
		//		Defines a module. If the module has any dependencies, the loader will
		//		resolve them before evaluating the module.
		//
		//		If any of the dependencies fail to load or the module definition causes
		//		an error, the entire definition is aborted.
		//
		// name: String|Array?
		//		Optional. The module name (if a string) or array of module IDs (if an array) of the module being defined.
		//
		// deps: Array?
		//		Optional. An array of module IDs that the rawDef being defined requires.
		//
		// rawDef: Object|Function
		//		An object or function that returns an object defining the module.
		//
		// example:
		//		Anonymous module, no deps, object definition.
		//
		//		Loader tries to detect module name, fails and ignores definition if more
		//		unable to determine name or there's already anonymous module tied to the
		//		name found.
		//
		//		If the module name is determined, then the module definition
		//		is immediately defined.
		//
		//		|	define({
		//		|		sq: function(x) { return x * x; }
		//		|	});
		//
		// example:
		//		Anonymous module, no deps, rawDef definition.
		//
		//		Loader tries to detect module name, fails and ignores definition if more
		//		unable to determine name or there's already anonymous module tied to the
		//		name found.
		//
		//		Since no deps, module definition is treated as a CommonJS module and is
		//		passed in passed require, exports, and module arguments, then immediately
		//		evaluated.
		//
		//		|	define(function(require, exports, module) {
		//		|		return {
		//		|			sq: function(x) { return x * x; }
		//		|		};
		//		|	});
		//
		// example:
		//		Named module, no deps, object definition.
		//
		//		Since no deps, the module definition is immediately defined.
		//
		//		|	define("arithmetic", {
		//		|		sq: function(x) { return x * x; }
		//		|	});
		//
		// example:
		//		Named module, no deps, rawDef definition.
		//
		//		Since no deps, module definition is treated as a CommonJS module and is
		//		passed in passed require, exports, and module arguments, then immediately
		//		evaluated.
		//
		//		|	define("arithmetic", function(require, exports, module) {
		//		|		return {
		//		|			sq: function(x) { return x * x; }
		//		|		};
		//		|	});
		//
		// example:
		//		Anonymous module, two deps, object definition.
		//
		//		Loader tries to detect module name, fails and ignores definition if more
		//		unable to determine name or there's already anonymous module tied to the
		//		name found.
		//
		//		If the module name is determined, then the loader will load the two
		//		dependencies, then once the dependencies are loaded, it will evaluate a
		//		function wrapper around the module definition.
		//
		//		|	define(["dep1", "dep2"], {
		//		|		sq: function(x) { return x * x; }
		//		|	});
		//
		// example:
		//		Anonymous module, two deps, function definition.
		//
		//		Loader tries to detect module name, fails and ignores definition if more
		//		unable to determine name or there's already anonymous module tied to the
		//		name found.
		//
		//		If the module name is determined, then the loader will load the two
		//		dependencies, then once the dependencies are loaded, it will evaluate
		//		the rawDef function.
		//
		//		|	define(["dep1", "dep2"], function(dep1, dep2) {
		//		|		return {
		//		|			sq: function(x) { return x * x; }
		//		|		};
		//		|	});
		//
		// example:
		//		Name module, two deps, object definition.
		//
		//		After the two dependencies are loaded, the loader will evaluate a
		//		function wrapper around the module definition.
		//
		//		|	define("arithmetic", ["dep1", "dep2"], {
		//		|		sq: function(x) { return x * x; }
		//		|	});
		//
		// example:
		//		Name module, two deps, function definition.
		//
		//		After the two dependencies are loaded, the loader will evaluate the
		//		function rawDef.
		//
		//		|	define("arithmetic", ["dep1", "dep2"], function(dep1, dep2) {
		//		|		return {
		//		|			sq: function(x) { return x * x; }
		//		|		};
		//		|	});

		var i = ["require"],
			module;

		if (!rawDef) {
			rawDef = deps || name;
			rawDef.length === 1 || i.concat(["exports", "module"]);
			if (typeof name !== "string") {
				deps = deps ? name : i;
				name = 0;
			} else {
				deps = i;
			}
		}

		if (reservedModuleIdsRegExp.test(name)) {
			throw new Error("Not allowed to define reserved module id \"" + name + "\"");
		}

		if (is(rawDef, "Function") && arguments.length === 1) {
			// treat rawDef as CommonJS definition and scan for any requires and add
			// them to the dependencies so that they can be loaded and passed in.
			rawDef.toString()
				.replace(commentRegExp, "")
				.replace(cjsRequireRegExp, function(match, dep) {
					deps.push(dep);
				});
		}

		module = getResourceDef(name, 0, deps, rawDef, 0, 1);

		// if not waiting for this module to be loaded, then the define() call was
		// possibly inline or deferred, so try fulfill dependencies, and define the
		// module right now.
		if (name && !waiting[name]) {
			module.execute();

		// otherwise we are definitely waiting for a script to load, eventhough we
		// may not know the name, we'll know when the script's onload fires.
		} else if (name || !isEmpty(waiting)) {
			defQ.push(module);

		// finally, we we're ask to define something without a name and there's no
		// scripts pending, so there's no way to know what the name is. :(
		} else {
			throw new Error("Unable to define anonymous module");
		}
	}

	// set the "amd" property and advertise supported features
	def.amd = {
		plugins: true,
		vendor: "titanium"
	};

	function toUrl(name, refModule) {
		// summary:
		//		Converts a module name including extension to a URL path.
		//
		// name: String
		//		The module name including extension.
		//
		// returns: String
		//		The fully resolved URL.
		//
		// example:
		//		Returns the URL for a HTML template file.
		//		|	define(function(require) {
		//		|		var templatePath = require.toUrl("./templates/example.html");
		//		|	});

		var	match = name.match(/(.+)(\.[^\/\.]+?)$/),
			module = getResourceDef((match && match[1]) || name, refModule, 0, 0, 1),
			url = module.url;

		module.pkg !== null && (url = url.substring(0, url.length - 3));
		return url + ((match && match[2]) || "");
	}

	function req(deps, callback, refModule) {
		// summary:
		//		Fetches a module, caches its definition, and returns the module. If an
		//		array of modules is specified, then after all of them have been
		//		asynchronously loaded, an optional callback is fired.
		//
		// deps: String | Array
		//		A string or array of strings containing valid module identifiers.
		//
		// callback: Function?
		//		Optional. A function that is fired after all dependencies have been
		//		loaded. Only applicable if deps is an array.
		//
		// refModule: Object?
		//		A reference map used for resolving module URLs.
		//
		// returns: Object | Function
		//		If calling with a string, it will return the corresponding module
		//		definition.
		//
		//		If calling with an array of dependencies and a callback function, the
		//		require() function returns itself.
		//
		// example:
		//		Synchronous call.
		//		|	require("arithmetic").sq(10); // returns 100
		//
		// example:
		//		Asynchronous call.
		//		|	require(["arithmetic", "convert"], function(arithmetic, convert) {
		//		|		convert(arithmetic.sq(10), "fahrenheit", "celsius"); // returns 37.777
		//		|	});

		return fetch(deps, function(deps) {
			callback && callback.apply(null, deps);
		}, function(ex) {
			throw ex;
		}, refModule) || req;
	}

	req.toUrl = toUrl;
	req.config = cfg;
	mix(req, fnMixin = {
		each: each,
		evaluate: evaluate,
		has: has,
		is: is,
		isDef: isDef,
		mix: mix,
		on: on
	});

	req.cache = function(subject) {
		// summary:
		//		Copies module definitions into the definition cache.
		//
		// description:
		//		When running a build, the build will call this function and pass in an
		//		object with module id => function. Each function contains the contents
		//		of the module's file.
		//
		//		When a module is required, the loader will first see if the module has
		//		already been defined.  If not, it will then check this cache and execute
		//		the module definition.  Modules not defined or cached will be fetched
		//		remotely.
		//
		// subject: String | Object
		//		When a string, returns the cached object or undefined otherwise an object
		//		with module id => function where each function wraps a module.
		//
		// example:
		//		This shows what build system would generate. You should not need to do this.
		//		|	require.cache({
		//		|		"arithmetic": function() {
		//		|			define(["dep1", "dep2"], function(dep1, dep2) {
		//		|				var api = { sq: function(x) { return x * x; } };
		//		|			});
		//		|		},
		//		|		"my/favorite": function() {
		//		|			define({
		//		|				color: "red",
		//		|				food: "pizza"
		//		|			});
		//		|		}
		//		|	});
		var p, m, re = /^url\:(.+)/;
		if (is(subject, "String")) {
			return defCache[subject];
		} else {
			for (p in subject) {
				m = p.match(re);
				if (m) {
					defCache[toUrl(m[1])] = subject[p];
				} else {
					m = getResourceDef(p, 0, 0, subject[p], 1);
					defCache[m.name] = m.rawDef;
				}
			}
		}
	};

	// expose require() and define() to the global namespace
	global.require = req;
	global.define = def;

}(window));

require.cache({
	"Ti/_": function() {
		define(function() {
			// Pre-calculate the screen DPI
			var body = document.body,
				measureDiv = document.createElement('div'),
				dpi;
			measureDiv.style.width = "1in";
			measureDiv.style.visibility = "hidden";
			body.appendChild(measureDiv);
			dpi = parseInt(measureDiv.clientWidth);
			body.removeChild(measureDiv);

			return {
				dpi: dpi,
				getAbsolutePath: function(path) {
					/^app\:\/\//.test(path) && (path = path.substring(6));
					/^\//.test(path) && (path = path.substring(1));
					return /^\/\//.test(path) || path.indexOf("://") > 0 ? path : location.pathname.replace(/(.*)\/.*/, "$1") + "/" + path;
				},
				uuid: function() {
					/**
					 * Math.uuid.js (v1.4)
					 * Copyright (c) 2010 Robert Kieffer
					 * Dual licensed under the MIT and GPL licenses.
					 * <http://www.broofa.com>
					 * mailto:robert@broofa.com
					 */
					// RFC4122v4 solution:
					return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
						var r = Math.random() * 16 | 0,
							v = c == 'x' ? r : (r & 0x3 | 0x8);
						return v.toString(16);
					}).toUpperCase();
				}
			};
		});
	},
	"Ti/_/browser": function() {
		define(function() {
			var match = navigator.userAgent.toLowerCase().match(/(webkit|gecko|trident|presto)/);
			return {
				runtime: match ? match[0] : "unknown"
			};
		});
	},
	"Ti/_/css": function() {
		define(["Ti/_/string"], function(string) {
			function processClass(node, cls, adding) {
				var i = 0, p,
					cn = " " + node.className + " ",
					cls = require.is(cls, "Array") ? cls : cls.split(" ");

				for (; i < cls.length; i++) {
					p = cn.indexOf(" " + cls[i] + " ");
					if (adding && p === -1) {
						cn += cls[i] + " ";
					} else if (!adding && p !== -1) {
						cn = cn.substring(0, p) + cn.substring(p + cls[i].length + 1);
					}
				}

				node.className = string.trim(cn);
			}

			return {
				add: function(node, cls) {
					processClass(node, cls, 1);
				},

				remove: function(node, cls) {
					processClass(node, cls);
				},

				clean: function(cls) {
					return cls.replace(/[^A-Za-z0-9\-]/g, "");
				}
			};
		});
	},
	"Ti/_/declare": function() {
		define(["Ti/_/lang"], function(lang) {
			/**
			 * declare() functionality based on code from Dojo Toolkit.
			 *
			 * Dojo Toolkit
			 * Copyright (c) 2005-2011, The Dojo Foundation
			 * New BSD License
			 * <http://dojotoolkit.org>
			 */

			var is = require.is,
				mix = require.mix,
				classCounters = {};

			// C3 Method Resolution Order (see http://www.python.org/download/releases/2.3/mro/)
			function c3mro(bases, className) {
				var result = [],
					roots = [ {cls: 0, refs: []} ],
					nameMap = {},
					clsCount = 1,
					l = bases.length,
					i = 0,
					j, lin, base, top, proto, rec, name, refs;

				// build a list of bases naming them if needed
				for (; i < l; ++i) {
					base = bases[i];
					if (!base) {
						throw new Error('Unknown base class for "' + className + '" [' + i + ']');
					} else if(!is(base, "Function")) {
						throw new Error('Base class not a function for "' + className + '" [' + i + ']');
					}
					lin = base._meta ? base._meta.bases : [base];
					top = 0;
					// add bases to the name map
					for (j = lin.length - 1; j >= 0; --j) {
						proto = lin[j].prototype;
						proto.hasOwnProperty("declaredClass") || (proto.declaredClass = "uniqName_" + (counter++));
						name = proto.declaredClass;
						if (!nameMap.hasOwnProperty(name)) {
							nameMap[name] = {count: 0, refs: [], cls: lin[j]};
							++clsCount;
						}
						rec = nameMap[name];
						if (top && top !== rec) {
							rec.refs.push(top);
							++top.count;
						}
						top = rec;
					}
					++top.count;
					roots[0].refs.push(top);
				}

				// remove classes without external references recursively
				while (roots.length) {
					top = roots.pop();
					result.push(top.cls);
					--clsCount;
					// optimization: follow a single-linked chain
					while (refs = top.refs, refs.length == 1) {
						top = refs[0];
						if (!top || --top.count) {
							// branch or end of chain => do not end to roots
							top = 0;
							break;
						}
						result.push(top.cls);
						--clsCount;
					}
					if (top) {
						// branch
						for (i = 0, l = refs.length; i < l; ++i) {
							top = refs[i];
							--top.count || roots.push(top);
						}
					}
				}

				if (clsCount) {
					throw new Error('Can\'t build consistent linearization for ' + className + '"');
				}

				// calculate the superclass offset
				base = bases[0];
				result[0] = base ?
					base._meta && base === result[result.length - base._meta.bases.length] ?
						base._meta.bases.length : 1 : 0;

				return result;
			}

			function makeConstructor(bases, ctorSpecial) {
				return function() {
					var a = arguments,
						args = a,
						a0 = a[0],
						f, i, m, p,
						l = bases.length,
						preArgs,
						dc = this.declaredClass;

					classCounters[dc] || (classCounters[dc] = 0);
					this.widgetId = dc + ":" + (classCounters[dc]++);

					// 1) call two types of the preamble
					if (ctorSpecial && (a0 && a0.preamble || this.preamble)) {
						// full blown ritual
						preArgs = new Array(bases.length);
						// prepare parameters
						preArgs[0] = a;
						for (i = 0;;) {
							// process the preamble of the 1st argument
							(a0 = a[0]) && (f = a0.preamble) && (a = f.apply(this, a) || a);
							// process the preamble of this class
							f = bases[i].prototype;
							f = f.hasOwnProperty("preamble") && f.preamble;
							f && (a = f.apply(this, a) || a);
							if (++i === l) {
								break;
							}
							preArgs[i] = a;
						}
					}

					// 2) call all non-trivial constructors using prepared arguments
					for (i = l - 1; i >= 0; --i) {
						f = bases[i];
						m = f._meta;
						if (m) {
							f = m.ctor;
							lang.mixProps(this, m.hidden);
						}
						is(f, "Function") && f.apply(this, preArgs ? preArgs[i] : a);
					}

					// 3) mixin args if any
					if (is(a0, "Object")) {
						f = this.constants;
						for (i in a0) {
							a0.hasOwnProperty(i) && ((f && i in f ? f.__values__ : this)[i] = a0[i]);
						}
					}

					// 4) continue the original ritual: call the postscript
					f = this.postscript;
					f && f.apply(this, args);
				};
			}

			function mixClass(dest, src) {
				for (var p in src) {
					if (src.hasOwnProperty(p) && !/^(constructor|properties|constants|__values__)$/.test(p)) {
						is(src[p], "Function") && (src[p].nom = name);
						dest[p] = src[p];
					}
				}
				return dest;
			}

			function declare(className, superclass, definition) {
				// summary:
				//		Creates an instantiable class object.
				//
				// className: String?
				//		Optional. The name of the class.
				//
				// superclass: null | Object | Array
				//		The base class or classes to extend.
				//
				// definition: Object
				//		The definition of the class.

				if (!is(className, "String")) {
					definition = superclass;
					superclass = className;
					className = "";
				}
				definition = definition || {};

				var bases = [definition.constructor],
					ctor,
					i,
					mixins = 1,
					proto = {},
					superclassType = is(superclass),
					t;

				// build the array of bases
				if (superclassType === "Array") {
					bases = c3mro(superclass, className);
					superclass = bases[mixins = bases.length - bases[0]];
				} else if (superclassType === "Function") {
					t = superclass._meta;
					bases = bases.concat(t ? t.bases : superclass);
				} else if (superclassType === "Object") {
					ctor = new Function;
					mix(ctor.prototype, superclass);
					bases[0] = superclass = ctor;
				} else {
					superclass = 0;
				}

				// build the prototype chain
				if (superclass) {
					for (i = mixins - 1;; --i) {
						ctor = new Function;
						ctor.prototype = superclass.prototype;
						proto = new ctor;

						// stop if nothing to add (the last base)
						if (!i) {
							break;
						}

						// mix in properties
						t = bases[i];
						(t._meta ? mixClass : mix)(proto, t.prototype);

						// chain in new constructor
						ctor = new Function;
						ctor.superclass = superclass;
						ctor.prototype = proto;
						superclass = proto.constructor = ctor;
					}
				}

				// add all properties except constructor, properties, and constants
				mixClass(proto, definition);

				// if the definition is not an object, then we want to use its constructor
				t = definition.constructor;
				if (t !== Object.prototype.constructor) {
					t.nom = "constructor";
					proto.constructor = t;
				}

				// build the constructor and add meta information to the constructor
				mix(bases[0] = ctor = makeConstructor(bases, t), {
					_meta: {
						bases: bases,
						hidden: definition,
						ctor: definition.constructor
					},
					superclass: superclass && superclass.prototype,
					extend: function(src) {
						mixClass(this.prototype, src);
						return this;
					},
					prototype: proto
				});

				// now mix in just the properties and constants
				//lang.mixProps(proto, definition);

				// add "standard" methods to the prototype
				mix(proto, {
					constructor: ctor,
					// TODO: need a nice way of accessing the super method without using arguments.callee
					// getInherited: function(name, args) {
					//	return is(name, "String") ? this.inherited(name, args, true) : this.inherited(name, true);
					// },
					// inherited: inherited,
					isInstanceOf: function(cls) {
						var bases = this.constructor._meta.bases,
							i = 0,
							l = bases.length;
						for (; i < l; ++i) {
							if (bases[i] === cls) {
								return true;
							}
						}
						return this instanceof cls;
					}
				});

				// add name if specified
				if (className) {
					proto.declaredClass = className;
					lang.setObject(className, ctor);
				}

				return ctor;
			}

			return declare;
		});
	},
	"Ti/_/dom": function() {
		define(["Ti/_", "Ti/_/style"], function(_, style) {
			/**
			 * create(), attr(), place(), & remove() functionality based on code from Dojo Toolkit.
			 *
			 * Dojo Toolkit
			 * Copyright (c) 2005-2011, The Dojo Foundation
			 * New BSD License
			 * <http://dojotoolkit.org>
			 */

			var is = require.is,
				forcePropNames = {
					innerHTML:	1,
					className:	1,
					value:		1
				},
				attrNames = {
					// original attribute names
					classname: "class",
					htmlfor: "for",
					// for IE
					tabindex: "tabIndex",
					readonly: "readOnly"
				},
				names = {
					// properties renamed to avoid clashes with reserved words
					"class": "className",
					"for": "htmlFor",
					// properties written as camelCase
					tabindex: "tabIndex",
					readonly: "readOnly",
					colspan: "colSpan",
					frameborder: "frameBorder",
					rowspan: "rowSpan",
					valuetype: "valueType"
				},
				attr = {
					add: function(node, name, value) {
						if (arguments.length === 2) {
							// the object form of setter: the 2nd argument is a dictionary
							for (var x in name) {
								attr.add(node, x, name[x]);
							}
							return node;
						}

						var lc = name.toLowerCase(),
							propName = names[lc] || name,
							forceProp = forcePropNames[propName],
							attrId, h;

						if (propName === "style" && !require.is(value, "String")) {
							return style.set(node, value);
						}

						if (forceProp || is(value, "Boolean") || is(value, "Function")) {
							node[name] = value;
							return node;
						}

						// node's attribute
						node.setAttribute(attrNames[lc] || name, value);
						return node;
					},
					remove: function(node, name) {
						node.removeAttribute(name);
						return node;
					}
				};

			return {
				create: function(tag, attrs, refNode, pos) {
					var doc = refNode ? refNode.ownerDocument : document;
					is(tag, "String") && (tag = doc.createElement(tag));
					attrs && attr.add(tag, attrs);
					refNode && this.place(tag, refNode, pos);
					return tag;
				},

				attr: attr,

				place: function(node, refNode, pos) {
					refNode.appendChild(node);
					return node;
				},

				detach: function(node) {
					return node.parentNode && node.parentNode.removeChild(node);
				},

				destroy: function(node) {
					try {
						var destroyContainer = node.ownerDocument.createElement("div");
						destroyContainer.appendChild(this.detach(node) || node);
						destroyContainer.innerHTML = "";
					} catch(e) {
						/* squelch */
					}
				},

				unitize: function(x) {
					return isNaN(x-0) || x-0 != x ? x : x + "px"; // note: must be != and not !==
				},

				computeSize: function(x, totalLength, convertAutoToUndef) {
					var undef,
						type = require.is(x);

					if (type === "String") {
						if (x === "auto") {
							convertAutoToUndef && (x = undef);
						} else {
							var value = parseFloat(x),
								units = x.substring((value + "").length);

							switch(units) {
								case "%":
									if(totalLength == "auto") {
										return "auto";
									} else if (!require.is(totalLength,"Number")) {
										console.error("Could not compute percentage size/position of element.");
										return;
									} 
									return value / 100 * totalLength;
								case "mm":
									value *= 10;
								case "cm":
									return value * 0.0393700787 * _.dpi;
								case "pc":
									dpi /= 12;
								case "pt":
									dpi /= 72;
								case "in":
									return value * _.dpi;
								case "px":
								case "dp":
									return value;
							}
						}
					} else if (type !== "Number") {
						x = undef;
					}

					return x;
				}
			};
		});
	},
	"Ti/_/event": function() {
		define({
			stop: function(e) {
				if (e) {
					e.preventDefault && e.preventDefault();
					e.stopPropagation && e.stopPropagation();
				}
			},
			off: function(handles) {
				require.each(require.is(handles, "Array") ? handles : [handles], function(h) {
					h && h();
				});
			}
		});
	},
	"Ti/_/include": function() {
		define(function() {
			var cache = {},
				stack = [];

			return {
				dynamic: true, // prevent the loader from caching the result

				normalize: function(name, normalize) {
					var parts = name.split("!"),
						url = parts[0];
					parts.shift();
					return (/^\./.test(url) ? normalize(url) : url) + (parts.length ? "!" + parts.join("!") : "");
				},

				load: function(name, require, onLoad, config) {
					var c,
						x,
						parts = name.split("!"),
						len = parts.length,
						url,
						sandbox;

					if (sandbox = len > 1 && parts[0] === "sandbox") {
						parts.shift();
						name = parts.join("!");
					}

					url = require.toUrl(/^\//.test(name) ? name : "./" + name, stack.length ? { name: stack[stack.length-1] } : null);
					c = cache[url] || require.cache(url);

					if (!c) {
						x = new XMLHttpRequest();
						x.open("GET", url, false);
						x.send(null);
						if (x.status === 200) {
							c = x.responseText;
						} else {
							throw new Error("Failed to load include \"" + url + "\": " + x.status);
						}
					}

					stack.push(url);
					try {
						require.evaluate(cache[url] = c, 0, !sandbox);
					} catch (e) {
						throw e;
					} finally {
						stack.pop();
					}

					onLoad(c);
				}
			};
		});
	},
	"Ti/_/lang": function() {
		define(["Ti/_/string"], function(string) {
			/**
			 * hitch() and setObject() functionality based on code from Dojo Toolkit.
			 *
			 * Dojo Toolkit
			 * Copyright (c) 2005-2011, The Dojo Foundation
			 * New BSD License
			 * <http://dojotoolkit.org>
			 */

			var global = this,
				hitch,
				is = require.is;

			function toArray(obj, offset) {
				return [].concat(Array.prototype.slice.call(obj, offset||0));
			}

			function hitchArgs(scope, method) {
				var pre = toArray(arguments, 2);
					named = is(method, "String");
				return function() {
					var s = scope || global,
						f = named ? s[method] : method;
					return f && f.apply(s, pre.concat(toArray(arguments)));
				};
			}

			return {
				hitch: hitch = function(scope, method) {
					if (arguments.length > 2) {
						return hitchArgs.apply(global, arguments);
					}
					if (!method) {
						method = scope;
						scope = null;
					}
					if (is(method, "String")) {
						scope = scope || global;
						if (!scope[method]) {
							throw(['hitch: scope["', method, '"] is null (scope="', scope, '")'].join(''));
						}
						return function() {
							return scope[method].apply(scope, arguments || []);
						};
					}
					return !scope ? method : function() {
						return method.apply(scope, arguments || []);
					};
				},

				mixProps: function(dest, src, everything) {
					var d, i, p, v, special = { properties: 1, constants: 0 };
					for (p in src) {
						if (src.hasOwnProperty(p) && !/^(constructor|__values__)$/.test(p)) {
							if (p in special) {
								d = dest[p] || (dest[p] = {});
								d.__values__ || (d.__values__ = {});
								for (i in src[p]) {
									(function(property, externalDest, internalDest, valueDest, /* setter/getter, getter, or value */ descriptor, capitalizedName, writable) {
										var o = is(descriptor, "Object"),
											getter = o && is(descriptor.get, "Function") && descriptor.get,
											setter = o && is(descriptor.set, "Function") && descriptor.set,
											pt = o && is(descriptor.post),
											post = pt === "Function" ? descriptor.post : pt === "String" ? hitch(externalDest, descriptor.post) : 0;

										if (o && (getter || setter || post)) {
											valueDest[property] = descriptor.value;
										} else if (is(descriptor, "Function")) {
											getter = descriptor;
										} else {
											valueDest[property] = descriptor;
										}

										// first set the internal private interface
										Object.defineProperty(internalDest, property, {
											get: function() {
												return getter ? getter.call(externalDest, valueDest[property]) : valueDest[property];
											},
											set: function(v) {
												var args = [v, valueDest[property]];
												args[0] = valueDest[property] = setter ? setter.apply(externalDest, args) : v;
												post && post.apply(externalDest, args);
											},
											configurable: true,
											enumerable: true
										});

										// this is the public interface
										Object.defineProperty(dest, property, {
											get: function() {
												return internalDest[property];
											},
											set: function(v) {
												if (!writable) {
													throw new Error('Property "' + property + '" is read only');
												}
												internalDest[property] = v;
											},
											configurable: true,
											enumerable: true
										});

										if (require.has("declare-property-methods") && (writable || property.toUpperCase() !== property)) {
											externalDest["get" + capitalizedName] = function() { return internalDest[property]; };
											writable && (externalDest["set" + capitalizedName] = function(v) { return internalDest[property] = v; });
										}
									}(i, dest, d, d.__values__, src[p][i], string.capitalize(i), special[p]));
								}
							} else if (everything) {
								dest[p] = src[p];
							}
						}
					}
					return dest;
				},

				setObject: function(name) {
					var parts = name.split("."),
						q = parts.pop(),
						obj = window,
						i = 0,
						p = parts[i++],
						value = {};

					if (p) {
						do {
							obj = p in obj ? obj[p] : (obj[p] = {});
						} while (obj && (p = parts[i++]));
					}

					if (!obj || !q) {
						return undefined;
					}

					// need to mix args into values
					for (i = 1; i < arguments.length; i++) {
						is(arguments[i], "Object") ? this.mixProps(value, arguments[i], 1) : (value = arguments[i]);
					}

					return obj[q] = value;
				},

				toArray: toArray,

				val: function(originalValue, defaultValue) {
					return is(originalValue, "Undefined") ? defaultValue : originalValue;
				}
			};
		});
	},
	"Ti/_/ready": function() {
		define(["Ti/_/lang"], function(lang) {
			/**
			 * ready() functionality based on code from Dojo Toolkit.
			 *
			 * Dojo Toolkit
			 * Copyright (c) 2005-2011, The Dojo Foundation
			 * New BSD License
			 * <http://dojotoolkit.org>
			 */

			var doc = document,
				readyStates = { "loaded": 1, "complete": 1 },
				isReady = !!readyStates[doc.readyState],
				readyQ = [];

			if (!isReady) {
				function detectReady(evt) {
					if (isReady || (evt && evt.type == "readystatechange" && !readyStates[doc.readyState])) {
						return;
					}
					while (readyQ.length) {
						(readyQ.shift())();
					}
					isReady = 1;
				}

				readyQ.concat([
					require.on(doc, "DOMContentLoaded", detectReady),
					require.on(window, "load", detectReady)
				]);

				if ("onreadystatechange" in doc) {
					readyQ.push(require.on(doc, "readystatechange", detectReady));
				} else {
					function poller() {
						readyStates[doc.readyState] ? detectReady() : setTimeout(poller, 30);
					}
					poller();
				}
			}

			function ready(priority, context, callback) {
				var fn, i, l;
				if (!require.is(priority, "Number")) {
					callback = context;
					context = priority;
					priority = 1000;
				}
				fn = callback ? function(){ callback.call(context); } : context;
				if (isReady) {
					fn();
				} else {
					fn.priority = priority;
					for (i = 0, l = readyQ.length; i < l && priority >= readyQ[i].priority; i++) {}
					readyQ.splice(i, 0, fn);
				}
			}

			ready.load = function(name, require, onLoad) {
				ready(onLoad);
			};

			return ready;
		});
	},
	"Ti/_/string": function() {
		define({
			capitalize: function(s) {
				s = s || "";
				return s.substring(0, 1).toUpperCase() + s.substring(1);
			},

			trim: String.prototype.trim ?
				function(str){ return str.trim(); } :
				function(str){ return str.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); }
		});
	},
	"Ti/_/style": function() {
		define(["Ti/_", "Ti/_/string"], function(_, string) {
			var vp = require.config.vendorPrefixes.dom;

			function set(node, name, value) {
				var i = 0,
					x,
					uc;
				if (arguments.length > 2) {
					while (i < vp.length) {
						x = vp[i++];
						x += x ? uc || (uc = string.capitalize(name)) : name;
						if (x in node.style) {
							require.each(require.is(value, "Array") ? value : [value], function(v) { node.style[x] = v; });
							return value;
						}
					}
				} else {
					for (x in name) {
						set(node, x, name[x]);
					}
				}
				return node;
			}

			return {
				url: function(url) {
					return !url ? "" : /^url\(/.test(url) ? url : "url(" + _.getAbsolutePath(url) + ")";
				},

				get: function(node, name) {
					if (require.is(name, "Array")) {
						for (var i = 0; i < name.length; i++) {
							name[i] = node.style[name[i]];
						}
						return name;
					}
					return node.style[name];
				},

				set: set
			};
		});
	}
});