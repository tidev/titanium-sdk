import { formatWithOptions } from '../node/internal/util/inspect';

const nativeDebug = console.debug;
const nativeError = console.error;
const nativeInfo = console.info;
const nativeLog = console.log;
const nativeWarn = console.warn;

const kColorInspectOptions = { colors: true };
const kNoColorInspectOptions = {};

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
