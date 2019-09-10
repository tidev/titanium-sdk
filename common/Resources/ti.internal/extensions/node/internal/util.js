// Copyright Node.js contributors. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

/**
 * Node's lib/internal/util.js modified for Axway Titanium
 *
 * @see https://github.com/nodejs/node/blob/master/lib/internal/util.js
 */

import { isNativeError } from './util/types';

const kNodeModulesRE = /^(.*)[\\/]node_modules[\\/]/;

export const customInspectSymbol = Symbol.for('nodejs.util.inspect.custom');
export const isBuffer = Symbol.for('titanium.buffer.isBuffer');

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

const ALL_PROPERTIES = 0;
const ONLY_ENUMERABLE = 2;

export const propertyFilter = {
	ALL_PROPERTIES,
	ONLY_ENUMERABLE
};

export function getOwnNonIndexProperties(obj, filter) {
	const props = [];
	const keys = filter === ONLY_ENUMERABLE ? Object.keys(obj) : Object.getOwnPropertyNames(obj);
	for (var i = 0; i < keys.length; ++i) {
		const key = keys[i];
		if (!isAllDigits(key)) {
			props.push(key);
		}
	}
	return props;
}

function isAllDigits(s) {
	if (s.length === 0) {
		return false;
	}
	for (var i = 0; i < s.length; ++i) {
		const code = s.charCodeAt(i);
		if (code < 48 || code > 57) {
			return false;
		}
	}
	return true;
}
