/**
 * This file is used to hijack the standard require to allow for JS
 * implementations of "core" modules.
 *
 * You add a binding from the "core" module id to the under the hood JS
 * implementation. We then intercept require calls to handle requests for these modules
 * and lazily load the file.
 */

/**
 * Used by @function bindObjectToCoreModuleId
 * @type {map<string, object>}
 */
const bindings = new Map();

/**
 * Used by @function redirectCoreModuleIdToPath
 * @type {map<string, string>}
 */
const redirects = new Map();

/**
 * Does the request look like a typical core module? (no '.' or '/' characters)
 * @param {string} path original require path/id
 * @returns {boolean}
 */
function isHijackableModuleId(path) {
	if (!path || path.length < 1) {
		return false;
	}
	const firstChar = path.charAt(0);
	return firstChar !== '.' && firstChar !== '/';
}

// Hack require to point to this as core module "binding". (Note that iOS does not have a global require.)
const originalRequire = global.require ? global.require : require.main.require.bind(require.main);
// This works for Windows as-is, and also intercepts the call on Android/iOS for ti.main.js (the first file executed)
global.require = function (moduleId) {

	if (bindings.has(moduleId)) {
		return bindings.get(moduleId);
	}
	if (redirects.has(moduleId)) {
		moduleId = redirects.get(moduleId);
	}

	return originalRequire(moduleId);
};

// ... but we still need to hack it when requiring from other files for Android/iOS (due to module.js impl)
const originalModuleRequire = global.Module.prototype.require;
global.Module.prototype.require = function (path, context) {

	if (bindings.has(path)) {
		return bindings.get(path);
	}
	if (redirects.has(path)) {
		path = redirects.get(path);
	}

	return originalModuleRequire.call(this, path, context);
};

/**
 * Registers a binding from a short module id to an already loaded/constructed object/value to export for that core module id
 *
 * @param {string} moduleId the module id to "hijack"
 * @param {*} binding an already constructured value/object to return
 */
export function register(moduleId, binding) {
	if (!isHijackableModuleId(moduleId)) {
		throw new Error(`Cannot register for relative/absolute file paths; no leading '.' or '/' allowed (was given ${moduleId})`);
	}

	if (redirects.has(moduleId)) {
		Ti.API.warn(`Another binding has already registered for module id: '${moduleId}', it will be overwritten...`);
		redirects.delete(moduleId);
	} else if (bindings.has(moduleId)) {
		Ti.API.warn(`Another binding has already registered for module id: '${moduleId}', it will be overwritten...`);
	}

	bindings.set(moduleId, binding);
}

/**
 * Registers a binding from a short module id to the full under the hood filepath if given a string.
 * This allows for lazy instantiation of the module on-demand
 *
 * @param {string} moduleId the module id to "hijack"
 * @param {string} filepath the full filepath to require under the hood.
 *                              This should be an already resolved absolute path,
 *                              as otherwise the context of the call could change what gets loaded!
 */
export function redirect(moduleId, filepath) {
	if (!isHijackableModuleId(moduleId)) {
		throw new Error(`Cannot register for relative/absolute file paths; no leading '.' or '/' allowed (was given ${moduleId})`);
	}

	if (bindings.has(moduleId)) {
		Ti.API.warn(`Another binding has already registered for module id: '${moduleId}', it will be overwritten...`);
		bindings.delete(moduleId);
	} else if (redirects.has(moduleId)) {
		Ti.API.warn(`Another binding has already registered for module id: '${moduleId}', it will be overwritten...`);
	}

	redirects.set(moduleId, filepath);
}

// FIXME: There's a collision here with global.binding declared in KrollBridge.m on iOS
if (!global.binding) {
	global.binding = {};
}
global.binding.register = register;
global.binding.redirect = redirect;
