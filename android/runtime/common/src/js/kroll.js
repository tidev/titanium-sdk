/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
(function(kroll) {
	var TAG = "kroll";

	global = this;

	kroll.log(TAG, "global = " + global + ", runtime = " + kroll.runtime);

	function startup() {
		startup.globalVariables();
		startup.runMain();
	}

	startup.globalVariables = function() {
		kroll.log(TAG, "global variables");
		global.kroll = kroll;

		kroll.log(TAG, "events");
		NativeModule.require('events');

		kroll.log(TAG, "global.Titanium");
		global.Ti = global.Titanium = NativeModule.require('titanium');

		kroll.log(TAG, "global.Module");
		global.Module = NativeModule.require("module");
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
			throw new Error('No such native module ' + id + ', have keys: ' + Object.keys(NativeModule._source));
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
		'(function (exports, require, module, __filename, __dirname, global) { ',
		'\n});' ];

	NativeModule.prototype.compile = function() {
		if (kroll.runtime == "rhino") {
			// In Rhino we return pre-compiled Functions, so we just use with
			var scope = {
				exports: this.exports,
				require: NativeModule.require,
				module: this,
				__filename: this.filename,
				__dirname: null,
				global: global
			};

			kroll.requireNative(this.id, scope);

		} else {
			var source = NativeModule.getSource(this.id);
			source = NativeModule.wrap(source);

			var fn = runInThisContext(source, this.filename, true);
			fn(this.exports, NativeModule.require, this, this.filename, null, global);
		}

		this.loaded = true;
	};

	NativeModule.prototype.cache = function() {
		NativeModule._cache[this.id] = this;
	};

	kroll.log(TAG, "startup()");
	startup();
});
