import EventEmitter from './events';
import assertArgumentType from './_errors';

// Start our process uptime timer immediately!
const startTime = Date.now();

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

const process = new EventEmitter();
process.abort = () => {}; // TODO: Do we have equivalent of forcibly killing the process? We have restart, but I think we just want a no-op stub here
process.arch = standardizeArch(Ti.Platform.architecture);
process.argv = []; // TODO: What makes sense here? path to titanium cli for first arg? path to ti.main/app.js for second?
Object.defineProperty(process, 'argv0', {
	value: '', // TODO: Path to .app on iOS?
	writable: false,
	enumerable: true,
	configurable: false
});
process.binding = () => {
	throw new Error('process.binding is unsupported and not user-facing API');
};
process.channel = undefined;
process.chdir = () => {
	throw new Error('process.chdir is unsupported');
};
process.config = {};
process.connected = false;
process.cpuUsage = () => {
	// FIXME: Can we look at OS.cpus to get this data?
	return {
		user: 0,
		system: 0
	};
};
process.cwd = () => __dirname;
Object.defineProperty(process, 'debugPort', {
	get: function () {
		let value = 0; // default to 0
		try {
			if (Ti.Platform.osname === 'android') {
				const assets = kroll.binding('assets');
				const json = assets.readAsset('deploy.json');
				if (json) {
					const deployData = JSON.parse(json);
					if (deployData.debuggerPort !== -1) { // -1 means not set (not in debug mode)
						value = deployData.debuggerPort;
					}
				}
			} else if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
				// iOS is 27753 as of ios < 11.3 for simulators
				// for 11.3+ it uses a unix socket
				// for devices, it uses usbmuxd
				value = 27753; // TODO: Can we only return this for simulator < 11.3?
			}
		} catch (error) {
			// ignore
		}
		// overwrite this getter with static value
		Object.defineProperty(this, 'debugPort', {
			value: value,
			writable: true,
			enumerable: true,
			configurable: true
		});
		return value;
	},
	enumerable: true,
	configurable: true
});
process.disconnect = () => {}; // no-op
process.dlopen = () => {
	throw new Error('process.dlopen is not supported');
};
process.emitWarning = function (warning, options, code, ctor) { // eslint-disable-line no-unused-vars
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
};
function loadEnvJson() {
	try {
		const jsonFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory, '_env_.json');
		if (jsonFile.exists()) {
			return JSON.parse(jsonFile.read().text);
		}
	} catch (error) {
		Ti.API.error(`Failed to read "_env_.json". Reason: ${error.message}`);
	}
	return {};
}
Object.defineProperty(process, 'env', {
	get: function () {
		delete this.env;
		return this.env = loadEnvJson();
	},
	enumerable: true,
	configurable: true
});
process.execArgv = [];
process.execPath = ''; // FIXME: What makes sense here? Path to titanium CLI here?
process.exit = () => {
	throw new Error('process.exit is not supported');
};
process.exitCode = undefined;
process.noDeprecation = false;
process.pid = 0;
// FIXME: Should we try and adopt 'ipad'/'iphone' to 'darwin'? or 'ios'?
process.platform = Ti.Platform.osname;
process.ppid = 0;
// TODO: Add release property (Object)
// TODO: Can we expose stdout/stderr/stdin natively?
// Don't wrap console.log/error because technically global console wraps process.stdout/stderr (or should)
process.stderr = {
	isTTY: false,
	writable: true,
	write: (chunk, encoding, callback) => {
		Ti.API.error(chunk);
		if (callback) {
			callback();
		}
		return true;
	}
};
process.stdout = {
	isTTY: false,
	writable: true,
	write: (chunk, encoding, callback) => {
		Ti.API.info(chunk);
		if (callback) {
			callback();
		}
		return true;
	}
};
process.title = Ti.App.name;
process.throwDeprecation = false;
process.traceDeprecation = false;
process.umask = () => 0; // just always return 0
process.uptime = () => {
	const diffMs = Date.now() - startTime;
	return diffMs / 1000.0; // convert to "seconds" with fractions
};
process.version = Ti.version;
process.versions = {
	modules: '', // TODO: Report module api version (for current platform!)
	v8: '', // TODO: report android's v8 version (if on Android!)
	jsc: '' // TODO: report javascriptcore version for iOS/WIndows?
	// TODO: Report ios/Android/Windows platform versions?
};
process[Symbol.toStringTag] = 'process';

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

let uncaughtExceptionCallback = null;
process.hasUncaughtExceptionCaptureCallback = () => uncaughtExceptionCallback !== null;
process.setUncaughtExceptionCaptureCallback = (fn) => {
	if (fn === null) {
		uncaughtExceptionCallback = null;
		return;
	}
	assertArgumentType(fn, 'fn', 'function');
	if (uncaughtExceptionCallback !== null) {
		throw new Error('`process.setUncaughtExceptionCaptureCallback()` was called while a capture callback was already active');
	}
	uncaughtExceptionCallback = fn;
};

Ti.App.addEventListener('uncaughtException', function (event) {
	// Create an Error instance that wraps the data from the event
	// ideally we'd just forward along the original Error!
	const error = new Error(event.message);
	error.stack = event.backtrace;
	error.fileName = event.sourceName;
	error.lineNumber = event.line;
	error.columnNumber = event.lineOffset;
	if (process.hasUncaughtExceptionCaptureCallback()) {
		return uncaughtExceptionCallback(error);
	}
	// otherwise forward the event!
	process.emit('uncaughtException', error);
});

export default process;

// Use a nice predictable class/structure for our Immediate/Tick "timers"
// JS engine should be able to optimize easier
class CallbackWithArgs {
	constructor(func, args) {
		this.func = func;
		this.args = args;
	}

	run () {
		if (this.args) {
			this.func.apply(null, this.args);
		} else {
			this.fun();
		}
	}
}
// nextTick vs setImmediate should be handled in a semi-smart way
// Basically nextTick needs to drain the full queue (and can cause infinite loops if nextTick callback calls nextTick!)
// Then we should go through the "immediate" queue
// http://plafer.github.io/2015/09/08/nextTick-vs-setImmediate/
const tickQueue = [];
const immediateQueue = [];
let drainingTickQueue = false;
let drainQueuesTimeout = null;

/**
 * Iteratively runs all "ticks" until there are no more.
 * This can cause infinite recursion if a tick schedules another forever.
 */
function drainTickQueue() {
	if (drainingTickQueue) {
		return;
	}
	drainingTickQueue = true;

	while (tickQueue.length) {
		const tick = tickQueue.shift();
		tick.run();
	}
	drainingTickQueue = false;
}

function drainQueues() {
	// drain the full tick queue first...
	drainTickQueue();
	// tick queue should be empty!
	const immediatesRemaining = processImmediateQueue();
	if (immediatesRemaining !== 0) {
		// re-schedule draining our queues, as we have at least one more "immediate" to handle
		drainQueuesTimeout = setTimeout(drainQueues, 0);
	} else {
		drainQueuesTimeout = null;
	}
}

/**
 * Attempts to process "immediates" (in a much more leisurely way than ticks)
 * We give a 100ms window to run them in before re-scheduling the timeout to process them again.
 * If any ticks are added during invocation of immediate, we drain the tick queue fully before
 * proceeding to next immediate (if we still have time in our window).
 * @returns {number} number of remaining immediates to be processed
 */
function processImmediateQueue() {
	const immediateDeadline = Date.now() + 100; // give us up to 100ms to process immediates
	while (immediateQueue.length && (Date.now() < immediateDeadline)) {
		const immediate = immediateQueue.shift();
		immediate.run();
		if (tickQueue.length > 0) {
			// they added a tick! drain the tick queue before we do anything else (this *may* eat up our deadline/window to process any more immediates)
			drainTickQueue();
		}
	}
	return immediateQueue.length;
}

process.nextTick = function (callback, ...args) {
	assertArgumentType(callback, 'callback', 'function');
	tickQueue.push(new CallbackWithArgs(callback, args));
	if (!drainQueuesTimeout) {
		drainQueuesTimeout = setTimeout(drainQueues, 0);
	}
};

global.setImmediate = function (callback, ...args) {
	assertArgumentType(callback, 'callback', 'function');
	const immediate = new CallbackWithArgs(callback, args);
	immediateQueue.push(immediate);
	if (!drainQueuesTimeout) {
		drainQueuesTimeout = setTimeout(drainQueues, 0);
	}
	return immediate;
};

global.clearImmediate = function (immediate) {
	const index = immediateQueue.indexOf(immediate);
	if (index !== -1) {
		immediateQueue.splice(index, 1);
	}
};
