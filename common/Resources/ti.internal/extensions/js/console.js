import { formatWithOptions, inspect } from '../node/internal/util/inspect';

const nativeDebug = console.debug;
const nativeError = console.error;
const nativeInfo = console.info;
const nativeLog = console.log;
const nativeWarn = console.warn;

const kColorInspectOptions = { colors: true };
const kNoColorInspectOptions = {};

let groupIndent = '';
// TODO: Inject indents into the values!

console.debug = function (...args) {
	nativeDebug.call(console, formatWithOptions(kColorInspectOptions, ...args));
};

console.error = function (...args) {
	nativeError.call(console, formatWithOptions(kNoColorInspectOptions, ...args));
};

console.info = function (...args) {
	nativeInfo.call(console, formatWithOptions(kColorInspectOptions, ...args));
};

console.log = function (...args) {
	nativeLog.call(console, formatWithOptions(kColorInspectOptions, ...args));
};

console.warn = function (...args) {
	nativeWarn.call(console, formatWithOptions(kNoColorInspectOptions, ...args));
};

const times = new Map();
const counts = new Map();

function logTime(label, logData) {
	label = `${label}`;
	const startTime = times.get(label);
	if (!startTime) {
		console.warn(`Label "${label}" does not exist`);
		return true;
	}
	const duration = Date.now() - startTime;
	if (logData) {
		console.log(`${label}: ${duration}ms`, ...logData);
	} else {
		console.log(`${label}: ${duration}ms`);
	}
	return false;
}

console.time = function (label = 'default') {
	label = `${label}`;
	if (times.has(label)) {
		console.warn(`Label ${label}" already exists`);
		return;
	}
	times.set(label, Date.now());
};

console.timeEnd = function (label = 'default') {
	const warned = logTime(label);
	if (!warned) {
		times.delete(label);
	}
};

console.timeLog = function (label = 'default', ...logData) {
	logTime(label, logData);
};

// no-op
console.clear = function () {};

console.assert = function (value, ...args) {
	if (!value) {
		args[0] = `Assertion failed${args.length === 0 ? '' : `: ${args[0]}`}`;
		console.warn(...args);  // The arguments will be formatted in warn() again
	}
};

console.count = function (label = 'default') {
	// Ensures that label is a string, and only things that can be
	// coerced to strings. e.g. Symbol is not allowed
	label = `${label}`;
	let count = counts.get(label);
	if (count === undefined) {
		count = 1;
	} else {
		count++;
	}
	counts.set(label, count);
	console.log(`${label}: ${count}`);
};

console.countReset = function (label = 'default') {
	if (!counts.has(label)) {
		process.emitWarning(`Count for '${label}' does not exist`);
		return;
	}
	counts.delete(`${label}`);
};

console.dir = function (obj, options) {
	nativeLog.call(console, inspect(obj, {
		customInspect: false,
		...options
	}));
};

console.group = function (...data) {
	if (data.length > 0) {
		console.log(...data);
	}
	groupIndent += '  ';
};

console.groupEnd = function () {
	groupIndent = groupIndent.slice(0, groupIndent.length - 2);
};

// TODO: console.table()

console.dirxml = console.log;
console.groupCollapsed = console.group;
