// This is the file each platform loads on boot *before* we launch ti.main.js to insert all our shims/extensions
// and eventually load app.js
// This is where any common setup cross-platform should take place
// This is analagous to android's runtime/common/src/js directory before
// On Android, this will get baked into the binary as raw char* to be loaded
// On iOS, we'll simply evaluate/execute this before launching ti.main.js

// So what does Android do here?
// extends it's baked in EventEmitter
// Sets up require via module.js
// Loads path.js so it can do module.js
// Does special lazy hooking/bootstrapping of Titanium APIs/Proxy

/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_IOS,OS_ANDROID */
// We must wrap and export a bootstrap function to be able to delay access to kroll/global
// We're basically baking in the require wrapper function stuff in the code explicitly
import ModuleBootstrap from './ti.internal/bootstrap/module';
import TitaniumBootstrap from './ti.internal/bootstrap/titanium';
import invoker from './ti.internal/bootstrap/invoker';

/**
 * main bootstrapping function
 * @param {object} global the global object
 * @param {object} kroll; the kroll module/binding
 * @return {void}       [description]
 */
function bootstrap(global, kroll) {

	// Works identical to Object.hasOwnProperty, except
	// also works if the given object does not have the method
	// on its prototype or it has been masked.
	function hasOwnProperty(object, property) {
		return Object.hasOwnProperty.call(object, property);
	}

	kroll.extend = function (thisObject, otherObject) {
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
	};

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

	startup.globalVariables = function () {
		global.global = global;
		global.kroll = kroll;
		kroll.ScopeVars = ScopeVars;
		kroll.NativeModule = NativeModule; // So external module bootstrap.js can call NativeModule.require directly.

		OS_ANDROID && NativeModule.require('events');
		// TODO: This is a hack around NativeModule.require
		// Android bakes this stuff into native code bound to 'natives'
		// Then does fairly typical require wrapping of the source to load it
		// But for iOS I'm using rollup to bundle everything into one file
		// so we don't even use NativeModule - we expect everything to be bundled here and pass the relevant variables into exported functions
		// I don't know if there's a way to match Android, or which is better!
		// It may make sense to steal the notion of baking the js code into raw byte array in the obj-c to load from?
		// FIXME: Android has a lot of stuff it does in it's titanium.js that we likley need to port over!
		global.Ti = global.Titanium = TitaniumBootstrap(global, kroll);
		global.Module = ModuleBootstrap(global, kroll);
	};

	startup.runMain = function () {};

	const Script = OS_ANDROID ? kroll.binding('evals').Script : kroll.binding('Script');
	const runInThisContext = Script.runInThisContext;

	function NativeModule(id) {
		this.filename = id + '.js';
		this.id = id;
		this.exports = {};
		this.loaded = false;
	}

	/**
	 * This should be an object with string keys (baked in module ids) -> string values (source of the baked in js code)
	 */
	NativeModule._source = kroll.binding('natives');
	NativeModule._cache = {};

	NativeModule.require = function (id) {
		if (id === 'native_module') {
			return NativeModule;
		}
		if (id === 'invoker') {
			return invoker; // Android native modules use a bootstrap.js file that assumes there's a builtin 'invoker'
		}

		const cached = NativeModule.getCached(id);
		if (cached) {
			return cached.exports;
		}

		if (!NativeModule.exists(id)) {
			throw new Error('No such native module ' + id);
		}

		const nativeModule = new NativeModule(id);

		nativeModule.compile();
		nativeModule.cache();

		return nativeModule.exports;
	};

	NativeModule.getCached = function (id) {
		return NativeModule._cache[id];
	};

	NativeModule.exists = function (id) {
		return (id in NativeModule._source);
	};

	NativeModule.getSource = function (id) {
		return NativeModule._source[id];
	};

	NativeModule.wrap = function (script) {
		return NativeModule.wrapper[0] + script + NativeModule.wrapper[1];
	};

	NativeModule.wrapper = [
		'(function (exports, require, module, __filename, __dirname, Titanium, Ti, global, kroll) {',
		'\n});' ];

	NativeModule.prototype.compile = function () {

		let source = NativeModule.getSource(this.id);
		source = NativeModule.wrap(source);

		// All native modules have their filename prefixed with ti:/
		const filename = `ti:/${this.filename}`;

		const fn = runInThisContext(source, filename, true);
		fn(this.exports, NativeModule.require, this, this.filename, null, global.Ti, global.Ti, global, kroll);

		this.loaded = true;
	};

	NativeModule.prototype.cache = function () {
		NativeModule._cache[this.id] = this;
	};

	startup();
}

export default bootstrap;
