/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
(function(kroll) {
	var TAG = "kroll";
	var global = this;

	// Works identical to Object.hasOwnProperty, except
	// also works if the given object does not have the method
	// on its prototype or it has been masked.
	function hasOwnProperty(object, property) {
		return Object.hasOwnProperty.call(object, property);
	}

	kroll.extend = function(thisObject, otherObject)
	{
		if (!otherObject) {
			// extend with what?!  denied!
			return;
		}

		for (var name in otherObject) {
			if (hasOwnProperty(otherObject, name)) {
				thisObject[name] = otherObject[name];
			}
		}

		return thisObject;
	}

	function startup() {
		startup.globalVariables();
		startup.runMain();
	}

	// Used just to differentiate scope vars on java side by
	// using a unique constructor name
	function ScopeVars(vars) {
		if (!vars) {
			return this;
		}

		var keys = Object.keys(vars);
		var length = keys.length;

		for (var i = 0; i < length; ++i) {
			var key = keys[i];
			this[key] = vars[key];
		}
	}

	startup.globalVariables = function() {
		global.kroll = kroll;
		kroll.ScopeVars = ScopeVars;
		kroll.NativeModule = NativeModule; // So external module bootstrap.js can call NativeModule.require directly.

		NativeModule.require('events');
		global.Ti = global.Titanium = NativeModule.require('titanium');
		global.Module = NativeModule.require("module");
		global.console = NativeModule.require('console'); // Convenience toplevel alias for logging facilities
	};

	startup.runMain = function(mainModuleID) {
	};

	var runInThisContext = kroll.binding('evals').Script.runInThisContext;

	function NativeModule(id) {
		this.filename = id + '.js';
		this.id = id;
		this.exports = {};
		this.loaded = false;
	}

	NativeModule._source = kroll.binding('natives');
	NativeModule._cache = {};

	NativeModule.require = function(id) {
		if (id == 'native_module') {
			return NativeModule;
		}

		var cached = NativeModule.getCached(id);
		if (cached) {
			return cached.exports;
		}

		if (!NativeModule.exists(id)) {
			throw new Error('No such native module ' + id);
		}

		var nativeModule = new NativeModule(id);

		nativeModule.compile();
		nativeModule.cache();

		return nativeModule.exports;
	};

	NativeModule.getCached = function(id) {
		return NativeModule._cache[id];
	}

	NativeModule.exists = function(id) {
		return (id in NativeModule._source);
	}

	NativeModule.getSource = function(id) {
		return NativeModule._source[id];
	}

	NativeModule.wrap = function(script) {
		return NativeModule.wrapper[0] + script + NativeModule.wrapper[1];
	};

	NativeModule.wrapper = [
		'(function (exports, require, module, __filename, __dirname, Titanium, Ti, global, kroll) {\n',
		'\n});' ];

	NativeModule.prototype.compile = function() {
		if (kroll.runtime == "rhino") {
			// We need to call back into compiled JS Scripts in Rhino
			kroll.requireNative(this.id, this.exports, NativeModule.require, this, this.filename, null, global.Ti, global.Ti, global, kroll);

		} else {
			var source = NativeModule.getSource(this.id);
			source = NativeModule.wrap(source);

			// All native modules have their filename prefixed with ti:/
			var filename = 'ti:/' + this.filename;

			var fn = runInThisContext(source, filename, true);
			fn(this.exports, NativeModule.require, this, this.filename, null, global.Ti, global.Ti, global, kroll);
		}

		this.loaded = true;
	};

	NativeModule.prototype.cache = function() {
		NativeModule._cache[this.id] = this;
	};

	startup();
});
