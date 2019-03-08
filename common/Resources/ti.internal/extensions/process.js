'use strict';

/**
 * This function 'standardizes' the reported architectures to the equivalents reported by Node.js
 * node values: 'arm', 'arm64', 'ia32', 'mips', 'mipsel', 'ppc', 'ppc64', 's390', 's390x', 'x32', and 'x64'.
 * iOS values: "arm64", "armv7", "x86_64", "i386", "Unknown"
 * Android values: "armeabi", "armeabi-v7a", "arm64-v8a", "x86", "x86_64", "mips", "mips64", "unknown"
 * Windows values: "x64", "ia64", "ARM", "x86", "unknown"
 * @param {string} original original architecture reported by Ti.Platform
 * @returns {string}
 */
function standardizeArch(original) {
	switch (original) {
		// coerce 'armv7', 'armeabi', 'armeabi-v7a', 'ARM' -> 'arm'
		// 'armeabi' is a dead ABI for Android, removed in NDK r17
		case 'armv7':
		case 'armeabi':
		case 'armeabi-v7a':
		case 'ARM':
			return 'arm';

		// coerce 'arm64-v8a' -> 'arm64'
		case 'arm64-v8a':
			return 'arm64';

		// coerce 'i386', 'x86' -> 'ia32'
		case 'i386':
		case 'x86':
			return 'ia32';

		// coerce 'x86_64', 'ia64', 'x64' -> 'x64'
		case 'x86_64':
		case 'ia64':
			return 'x64';

		// coerce 'mips64' -> 'mips' // 'mips' and 'mips64' are dead ABIs for Android, removed in NDK r17
		case 'mips64':
			return 'mips';

		// coerce 'Unknown' -> 'unknown'
		case 'Unknown':
			return 'unknown';

		default:
			return original;
	}
}

const listeners = {};
const process = {
	arch: standardizeArch(Ti.Platform.architecture),
	noDeprecation: false,
	throwDeprecation: false,
	traceDeprecation: false,
	pid: 0,
	cwd: function () {
		return __dirname;
	},
	// FIXME: Should we try and adopt 'windowsphone'/'windowsstore' to 'win32'?
	// FIXME: Should we try and adopt 'ipad'/'iphone' to 'darwin'? or 'ios'?
	platform: Ti.Platform.osname,
	on: function (eventName, callback) {
		const eventListeners = listeners[eventName] || [];
		eventListeners.push(callback);
		listeners[eventName] = eventListeners;
		return this;
	},
	// TODO: Add #once which is like #on, but should get wrapped to remove itself before getting fired
	emit: function (eventName, ...args) {
		const eventListeners = listeners[eventName] || [];
		for (const listener of eventListeners) {
			listener.call(this, ...args);
		}
		return eventListeners.length !== 0;
	},
	eventNames: () => Object.getOwnPropertyNames(listeners),
	emitWarning: function (warning, options, code, ctor) {
		let type;
		let detail;
		if (typeof options === 'string') {
			type = options;
		} else if (typeof options === 'object') {
			type = options.type;
			code = options.code;
			detail = options.detail;
		}
		if (typeof warning === 'string') {
			// TODO: make use of `ctor` arg for limiting stack traces? Can only really be used on V8
			// set stack trace limit to 0, then call Error.captureStackTrace(warning, ctor);
			warning = new Error(warning);
			warning.name = type || 'Warning';
			if (code !== undefined) {
				warning.code = code;
			}
			if (detail !== undefined) {
				warning.detail = detail;
			}
		}
		// TODO: Throw TypeError if not an instanceof Error at this point!
		const isDeprecation = (warning.name === 'DeprecationWarning');
		if (isDeprecation && process.noDeprecation) {
			return; // ignore
		}
		if (isDeprecation && process.throwDeprecation) {
			throw warning;
		}
		this.emit('warning', warning);
	}
};
global.process = process;
// handle spitting out warnings
const WARNING_PREFIX = `(titanium:${process.pid}) `;
process.on('warning', warning => {
	const isDeprecation = (warning.name === 'DeprecationWarning');
	// if we're not doing deprecations, ignore!
	if (isDeprecation && process.noDeprecation) {
		return;
	}
	// TODO: Check process.traceDeprecation and if set, include stack trace in message!
	let msg = WARNING_PREFIX;
	if (warning.code !== undefined) {
		msg += `[${warning.code}] `;
	}
	if (warning.toString) {
		msg += warning.toString();
	}
	if (warning.detail) {
		msg += `\n${warning.detail}`;
	}
	console.error(msg);
});
module.exports = process;
