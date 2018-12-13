/**
 * This file is used to hijack the standard require to allow for JS
 * implementations of "core" modules.
 *
 * You add a binding from the "core" module id to the under the hood JS
 * implementation. We then intercept require calls to handle requests for these modules
 * and lazily load the file.
 */
'use strict';

const bindings = new Map();

// FIXME: Use a cache to avoid the redirection? Maybe just make the map hold either the filepath *or* the cached require result?
// Hack require to point to this as a core module "binding"
const originalRequire = global.require;
// This works for iOS as-is, and also intercepts the call on Android for ti.main.js (the first file executed)
global.require = function (moduleId) {
	if (bindings.has(moduleId)) {
		moduleId = bindings.get(moduleId);
	}
	return originalRequire(moduleId);
};

if (Ti.Platform.name === 'android') {
	// ... but we still need to hack it when requiring from other files for Android
	const originalModuleRequire = global.Module.prototype.require;
	global.Module.prototype.require = function (path, context) {
		if (bindings.has(path)) {
			path = bindings.get(path);
		}
		return originalModuleRequire.call(this, path, context);
	};
}

/**
 * Registers a binding from a short module id to the full under the hood filepath.
 * This allows for lazy instantiation of the module on-demand.
 *
 * @param {string} bindingId    the short module id
 * @param {string} internalPath the full filepath to require under the hood.
 *                              This should be an already resolved absolute path,
 *                              as otherwise the context of the call could change what gets loaded!
 */
function addBinding(bindingId, internalPath) {
	bindings.set(bindingId, internalPath);
}

module.exports = addBinding;
