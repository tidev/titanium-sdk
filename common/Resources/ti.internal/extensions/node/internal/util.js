import { isNativeError } from './util/types';

const kNodeModulesRE = /^(.*)[\\/]node_modules[\\/]/;

export const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');

const colorRegExp = /\u001b\[\d\d?m/g; // eslint-disable-line no-control-regex

export function removeColors(str) {
	return str.replace(colorRegExp, '');
}

export function isError(e) {
	// An error could be an instance of Error while not being a native error
	// or could be from a different realm and not be instance of Error but still
	// be a native error.
	return isNativeError(e) || e instanceof Error;
}

let getStructuredStack;
class StackTraceError extends Error { }
StackTraceError.prepareStackTrace = (err, trace) => trace;
StackTraceError.stackTraceLimit = Infinity;

export function isInsideNodeModules() {
	if (getStructuredStack === undefined) {
		getStructuredStack = () => new StackTraceError().stack;
	}

	let stack = getStructuredStack();

	// stack is only an array on v8, try to convert manually if string
	if (typeof stack === 'string') {
		const stackFrames = [];
		const lines = stack.split(/\n/);
		for (const line of lines) {
			const lineInfo = line.match(/(.*)@(.*):(\d+):(\d+)/);
			if (lineInfo) {
				const filename = lineInfo[2].replace('file://', '');
				stackFrames.push({ getFileName: () => filename });
			}
		}
		stack = stackFrames;
	}

	// Iterate over all stack frames and look for the first one not coming
	// from inside Node.js itself:
	if (Array.isArray(stack)) {
		for (const frame of stack) {
			const filename = frame.getFileName();
			// If a filename does not start with / or contain \,
			// it's likely from Node.js core.
			if (!/^\/|\\/.test(filename)) {
				continue;
			}
			return kNodeModulesRE.test(filename);
		}
	}

	return false;
}

export function join(output, separator) {
	let str = '';
	if (output.length !== 0) {
		const lastIndex = output.length - 1;
		for (let i = 0; i < lastIndex; i++) {
			// It is faster not to use a template string here
			str += output[i];
			str += separator;
		}
		str += output[lastIndex];
	}
	return str;
}

export function uncurryThis(f) {
	return function () {
		return f.call.apply(f, arguments);
	};
}
