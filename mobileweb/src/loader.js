(function (global) {

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
		modules = {};

	/******************************************************************************
	 * Utility functions
	 *****************************************************************************/

	/*
	function mix(dest, src) {
		// summary:
		//		Copies properties by reference from a source object to a destination
		//		object, then returns the destination object. To be clear, this will
		//		modify the dest being passed in.
		var p;
		for (p in src) {
			if (src.hasOwnProperty(p)) {
				dest[p] = src[p];
			}
		}
		return dest;
	}
	*/

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
		//		Tests if anything is a specific type.
		return ({}).toString.call(it).indexOf('[object ' + type) === 0;
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

	function evaluate(str, vars, globally) {
		var r = globally
				?	global.eval(str)
				:	(function (v, t) {
						// this trick will run the eval inside a sandbox where we must expose
						// any variables to the local scope, then capture them again.
						var f = new Function("__vars", "__js", "return eval('for(var i in __vars){this[i]=__vars[i];}'+__js+'for(i in __vars){__vars[i]=this[i];}__vars;');");
						return f(v, t);
					}(vars, str));
		// Firebug for some reason sometimes returns "_firebugIgnore" instead of
		// undefined or null, so force the value to null
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

	has.add = function (name, test, now, force){
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

	has.add("ie-event-behavior", doc.attachEvent && (typeof opera === "undefined" || !is(opera, "Opera")));

	/******************************************************************************
	 * Event handling
	 *****************************************************************************/

	function on(target, type, listener) {
		// summary:
		//		Connects a listener to an event on the specified target.

		if (type.call) {
			// event handler function
			return type.call(target, listener);
		}

		// TODO: fix touch events?

		if (has("ie-event-behavior")) {
			/^on/.test(type) || (type = "on" + type);

			// TODO: fix memory leak fix for IE8/Vista and older using the DOM0 hack

			target.attachEvent(type, listener);
			return function () {
				target.detachEvent(type, listener);
			};
		} else {
			target.addEventListener(type, listener, false);
			return function () {
				target.removeEventListener(type, listener, false);
			};
		}
	}

	on.once = function (target, type, listener) {
		var h = on(target, type, function () {
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

	function ResourceDef(name, refMap, deps, rawDef) {
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
		// refMap: Object?
		//		A reference map used for resolving module URLs.

		var match = name && name.match(/^(.+?)\!(.*)$/),
			isRelative = /^\./.test(name),
			exports = this.exports = {},
			url,
			pkg = null;

		// name could be:
		//  - a plugin		text!/some/file.html or include!/some/file.js
		//  - a module		some/module, ../some/module
		//  - a js file		/some/file.js
		//  - a url			http://www.google.com/

		this.name = name;
		this.deps = deps || [];
		this.plugin = null;

		if (/(^\/)|(\:)|(\.js$)/.test(name) || (isRelative && !refMap)) {
			this.url = name;
		} else {
			if (match) {
				this.plugin = this.deps.length;
				this.deps.push(match[1]);
			} else if (name) {
				// TODO: need to handle package names/paths and relative paths
				pkg = "";

				url = name;

				/(^\/)|(\:)/.test(url) || (url = baseUrl + url);

				is(pkg, "String") && (url += ".js");

				this.url = compactPath(url);
			}
		}

		this.pkg = pkg;
		this.rawDef = rawDef;
		this.loaded = !!rawDef;
		this.refMap = refMap;
		this.module = {
			exports: exports
		};
		this.require = function () {
			var args = Array.prototype.slice.call(arguments, 0);
			args.push(refMap);
			return req.apply(null, args);
		};
	}

	ResourceDef.prototype.load = function (sync, callback) {
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
			dc = defCache[_t.name],
			onLoad = function (rawDef) {
				_t.loaded = 1;
				if (_t.rawDef = rawDef) {
					if (is(rawDef, "String")) {
						if (/\.js$/.test(_t.url)) {
							rawDef = evaluate(rawDef, {
								require: _t.require,
								exports: _t.exports,
								module: _t.module
							});
							_t.def = !isEmpty(rawDef.exports) ? rawDef.exports : (!isEmpty(rawDef.module.exports) ? rawDef.module.exports : null);
						} else {
							_t.def = rawDef;
							_t.executed = 1;
						}
					}
				}
				processDefQ(_t);
				callback && callback(_t);
				return 1;
			};

		_t.sync = sync;

		// if we don't have a url, then I suppose we're loaded
		if (!_t.url) {
			_t.loaded = 1;
			callback && callback(_t);
			return;
		}

		// if we're already loaded or the definition has been cached, then just return now
		if (_t.loaded || dc) {
			return onLoad(dc);
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

			disconnector = on(x, has("ie-event-behavior") ? "readystatechange" : "load", function (e) {
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

	ResourceDef.prototype.execute = function (callback, evalGlobally) {
		// summary:
		//		Executes the resource's rawDef which defines the module.
		//
		// description:
		//
		// evalGlobally: Boolean
		//		If true and the rawDef is a string, then evals the rawDef in a sandboxed
		//		closure instead of the global namespace.

		var _t = this;

		if (_t.executed) {
			callback && callback();
			return;
		}

		// first need to make sure we have all the deps loaded
		fetch(_t.deps, function (deps) {
			var i,
				p,
				r = _t.rawDef,
				d = {
					require: _t.require,
					exports: _t.exports,
					module: _t.module
				},
				q = defQ.slice(0); // backup the defQ

			// need to wipe out the defQ
			defQ = [];

			_t.def = _t.def
				||	(r && (is(r, "String")
						? evaluate(r, d, evalGlobally)
						: is(r, "Function")
							? r.apply(null, deps)
							: is(r, "Object")
								? (function (obj, vars) {
										for (var i in vars){
											this[i] = vars[i];
										}
										return obj;
									}).call({}, r, d)
								: null
						)
					)
				||	_t.exports;

			// we might have just executed code above that could have caused a couple
			// define()'s to queue up
			processDefQ(_t);

			// restore the defQ
			defQ = q;

			// if plugin is not null, then it's the index in the deps array of the plugin
			// to invoke
			if (_t.plugin !== null) {
				p = deps[_t.plugin];
				p.load && p.load(_t.name, _t.require, function (val) {
					_t.def = val;
				});
			}

			_t.executed = 1;

			callback && callback();
		}, function (ex) {
			throw ex;
		}, _t.refMap, _t.sync);
	};

	function getResourceDef(name, refMap, deps, rawDef) {
		// summary:
		//		Creates a new resource definition or returns an existing one from cache.

		var module = new ResourceDef(name, refMap, deps, rawDef);

		if (/^(require|exports|module)$/.test(name)) {
			module.def = module[name];
			module.loaded = module.executed = 1;
			return module;
		}

		return module.name ? modules[module.name] || (modules[module.name] = module) : module;
	}

	function processDefQ(module) {
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

	function fetch(deps, success, failure, refMap, sync) {
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
		// refMap: Object?
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
			deps[i] && (function (idx, name) {
				getResourceDef(deps[idx], refMap).load(!!sync, function (m) {
					m.execute(function () {
						deps[idx] = m.def;
						if (--count === 0) {
							success && success(deps);
							count = -1; // prevent success from being called the 2nd time below
						}
					});
				});
			}(i, deps[i]));
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
		//		|		sq: function (x) { return x * x; }
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
		//		|	define(function (require, exports, module) {
		//		|		return {
		//		|			sq: function (x) { return x * x; }
		//		|		};
		//		|	});
		//
		// example:
		//		Named module, no deps, object definition.
		//
		//		Since no deps, the module definition is immediately defined.
		//
		//		|	define("arithmetic", {
		//		|		sq: function (x) { return x * x; }
		//		|	});
		//
		// example:
		//		Named module, no deps, rawDef definition.
		//
		//		Since no deps, module definition is treated as a CommonJS module and is
		//		passed in passed require, exports, and module arguments, then immediately
		//		evaluated.
		//
		//		|	define("arithmetic", function (require, exports, module) {
		//		|		return {
		//		|			sq: function (x) { return x * x; }
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
		//		|		sq: function (x) { return x * x; }
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
		//		|	define(["dep1", "dep2"], function (dep1, dep2) {
		//		|		return {
		//		|			sq: function (x) { return x * x; }
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
		//		|	define("arithmetic", ["dep1", "dep2"], function (dep1, dep2) {
		//		|		return {
		//		|			sq: function (x) { return x * x; }
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
				.replace(cjsRequireRegExp, function (match, dep) {
					deps.push(dep);
				});
		}

		// check all scripts we're waiting for to see there are any interactive
		if (has("ie-event-behavior") && !name) {
			for (i in waiting) {
				module = waiting[i];
				if (module && module.node && module.node.readyState === "interactive") {
					name = module.name;
					break;
				}
			}
		}

		module = getResourceDef(name, 0, deps, rawDef);

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
		plugins: true
	};

	function toUrl(name, refMap) {
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
		//		|	define(function (require) {
		//		|		var templatePath = require.toUrl("./templates/example.html");
		//		|	});

		var	match = name.match(/(.+)(\.[^\/\.]+?)$/),
			module = getResourceDef((match && match[1]) || name, refMap),
			url = module.url;
		is(module.pkg, "String") && (url = url.substring(0, url.length - 3));
		return url + ((match && match[2]) || "");
	}

	function req(deps, callback, refMap) {
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
		// refMap: Object?
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
		//		|	require(["arithmetic", "convert"], function (arithmetic, convert) {
		//		|		convert(arithmetic.sq(10), "fahrenheit", "celsius"); // returns 37.777
		//		|	});

		return fetch(deps, function (deps) {
			callback && callback.apply(null, deps);
		}, function (ex) {
			throw ex;
		}, refMap) || req;
	}

	req.has = has;
	req.on = on;
	req.toUrl = toUrl;

	req.cache = function(defs) {
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
		// defs: Object
		//		An object with module id => function where each function wraps a module.
		//
		// example:
		//		This shows what build system would generate. You should not need to do this.
		//		|	require.cache({
		//		|		"arithmetic": function () {
		//		|			define(["dep1", "dep2"], function (dep1, dep2) {
		//		|				var api = { sq: function (x) { return x * x; } };
		//		|			});
		//		|		},
		//		|		"my/favorite": function () {
		//		|			define({
		//		|				color: "red",
		//		|				food: "pizza"
		//		|			});
		//		|		}
		//		|	});
		var p, m, re = /^url\:(.+)/;
		for (p in defs) {
			m = p.match(re);
			if (m) {
				defCache[toUrl(m[1])] = defs[p];
			} else {
				m = getResourceDef(p);
				defCache[m.name] = defs[p];
			}
		}
	};

	// expose require() and define() to the global namespace
	global.require = req;
	global.define = def;

/*	graveyard...

	function defineModule(name, def) {
		var m = modules[name] = new ResourceDef(name);
		m.def = def;
		m.loaded = m.executed = 1;
	}

	defineModule("require", req);

	// define modules we already know about
	// need to define after require has been defined
	function defineModule(name, val) {
		defined[name] = {
			name: name
		};
	}

	if the rawDef is an object, need to wrap and pass in deps as a map!
			definition = (function (obj, vars) {
				for (var i in vars){
					this[i] = vars[i];
				}
				return obj;
			}(rawDef, moduleMapThinger));

	this nugget is for evaling xhr text responses:
			(function (v, t) {
				var f = new Function("__vars", "__js", "return eval('for(var i in __vars){this[i]=__vars[i];}'+__js);");
				return f(v, t);
			}({
				"exports": this.exports
				// TODO: need to pass in "require" and "module"
			}, this.rawDef));


	each(["require", "exports", "module"], defineModule);

	defined = {
		"require": req,
		"exports": {},
		"module": {} // TODO: need to initialize
		"has": ???
	};
	

	this is from fetch() sync path	
			// "deps" is really the "name"
			module = getResourceDef(deps, refMap);

			if (has("fetch-single-module")) {
				// non-standard: if the module isn't loaded, try loading it via XHR
				module.loaded || module.load(1); // let exceptions bubble up
			}

			if (module.loaded && (module.executed || module.execute())) {
				success && success([module]); // non-standard, but harmless
				return module.def;
			}

			failure('Module "' + deps + '" failed to load and execute');


	original define() invoke now code:
			// TODO: define the module name, rawDef, fullname, url, etc
			// TODO: need to define a refMap for 4th arg???
			fetch(deps, function (deps) {
				// TODO: execute *this* module with the deps
			}, function (ex) {
				throw ex;
			});

*/
}(window));
