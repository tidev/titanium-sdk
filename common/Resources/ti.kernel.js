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
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* globals OS_ANDROID,OS_IOS */
// We must wrap and export a bootstrap function to be able to delay access to kroll/global
// We're basically baking in the require wrapper function stuff in the code explicitly
import ModuleBootstrap from './ti.internal/kernel/module';
import TitaniumBootstrap from './ti.internal/kernel/titanium';
import EventEmitterBootstrap from './ti.internal/kernel/android/events';
import NativeModuleBootstrap from './ti.internal/kernel/android/nativemodule';

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

	/**
	 * This is used to shuttle the sourceUrl around to APIs that may need to
	 * resolve relative paths based on the invoking file.
	 * (see KrollInvocation.java for more)
	 * @param {object} vars key/value pairs to store
	 * @param {string} vars.sourceUrl the source URL of the file calling the API
	 * @constructor
	 * @returns {ScopeVars}
	 */
	function ScopeVars(vars) {
		if (!vars) {
			return this;
		}

		const keys = Object.keys(vars);
		const length = keys.length;
		for (var i = 0; i < length; ++i) {
			const key = keys[i];
			this[key] = vars[key];
		}
	}

	function startup() {
		global.global = global; // hang the global object off itself
		global.kroll = kroll; // hang our special under the hood kroll object off the global
		if (OS_ANDROID) {
			kroll.ScopeVars = ScopeVars;
			// external module bootstrap.js expects to call kroll.NativeModule.require directly to load in their own source
			// and to refer to the baked in "bootstrap.js" for the SDK and "invoker.js" to hang lazy APIs/wrap api calls to pass in scope vars
			kroll.NativeModule = NativeModuleBootstrap(global, kroll);
			// Android uses it's own EventEmitter impl, and it's baked right into the proxy class chain
			// It assumes it can call back into java proxies to alert when listeners are added/removed
			// FIXME: Get it to use the events.js impl in the node extension, and get iOS to bake that into it's proxies as well!
			EventEmitterBootstrap(global, kroll);
		} else if (OS_IOS) {
			// route kroll.externalBinding to same impl as binding - we treat 1st and 3rd party native modules the same
			kroll.externalBinding = kroll.binding;
		}
		global.Ti = global.Titanium = TitaniumBootstrap(global, kroll);
		global.Module = ModuleBootstrap(global, kroll);
	}

	startup();
}

export default bootstrap;
