/**
 * Node's internal/errors module modified for Axway Titanium
 *
 * Only a few selected errors are exported manually here. Most of the functionality
 * is still missing and may be added as we move forward with Node compatibility.
 *
 * @see https://github.com/nodejs/node/blob/master/lib/internal/errors.js
 */

import assert from './assert';
import { format } from './util/inspect';

const messages = new Map();
export const codes = {};

// @todo implement this once needed
class SystemError extends Error {

}

// Utility function for registering the error codes.
function E(sym, val, def, ...otherClasses) {
	// Special case for SystemError that formats the error message differently
	// The SystemErrors only have SystemError as their base classes.
	messages.set(sym, val);

	if (def === SystemError) {
		throw new Error('Node compatible SystemError not yet implemented.');
	} else {
		def = makeNodeErrorWithCode(def, sym);
	}

	if (otherClasses.length !== 0) {
		otherClasses.forEach((clazz) => {
			def[clazz.name] = makeNodeErrorWithCode(clazz, sym);
		});
	}
	codes[sym] = def;
}

function makeNodeErrorWithCode(Base, key) {
	return class NodeError extends Base {
		constructor(...args) {
			super();
			const message = getMessage(key, args, this);
			Object.defineProperty(this, 'message', {
				value: message,
				enumerable: false,
				writable: true,
				configurable: true
			});
			addCodeToName(this, super.name, key);
		}

		get code() {
			return key;
		}

		set code(value) {
			Object.defineProperty(this, 'code', {
				configurable: true,
				enumerable: true,
				value,
				writable: true
			});
		}

		toString() {
			return `${this.name} [${key}]: ${this.message}`;
		}
	};
}

function getMessage(key, args, self) {
	const msg = messages.get(key);

	/*
	// @fixme rollup cannot handle lazy loaded modules, maybe move to webpack?
	if (assert === undefined) {
		assert = require('./internal/assert');
	}
	*/

	if (typeof msg === 'function') {
		assert(
			msg.length <= args.length, // Default options do not count.
			`Code: ${key}; The provided arguments length (${args.length}) does not `
				+	`match the required ones (${msg.length}).`
		);
		return msg.apply(self, args);
	}

	const expectedLength = (msg.match(/%[dfijoOs]/g) || []).length;
	assert(
		expectedLength === args.length,
		`Code: ${key}; The provided arguments length (${args.length}) does not `
			+ `match the required ones (${expectedLength}).`
	);
	if (args.length === 0) {
		return msg;
	}

	args.unshift(msg);
	return format.apply(null, args);
	// @fixme rollup cannot handle lazy loaded modules, maybe move to webpack?
	// return lazyInternalUtilInspect().format.apply(null, args);
}

function addCodeToName(err, name, code) {
	// Add the error code to the name to include it in the stack trace.
	err.name = `${name} [${code}]`;
	// Access the stack to generate the error message including the error code
	// from the name.
	// @fixme: This only works on V8/Android, iOS/JSC has a different Error structure.
	// should we try to make errors behave the same across platforms?
	// eslint-disable-next-line no-unused-expressions
	err.stack;
	// Reset the name to the actual name.
	if (name === 'SystemError') {
		Object.defineProperty(err, 'name', {
			value: name,
			enumerable: false,
			writable: true,
			configurable: true
		});
	} else {
		delete err.name;
	}
}

E('ERR_INTERNAL_ASSERTION', (message) => {
	const suffix = 'This is caused by either a bug in Titanium '
		+ 'or incorrect usage of Titanium internals.\n'
		+ 'Please open an issue with this stack trace at '
		+ 'https://jira.appcelerator.org\n';
	return message === undefined ? suffix : `${message}\n${suffix}`;
}, Error);
E('ERR_INVALID_ARG_TYPE', (name, expected, actual) => {
	assert(typeof name === 'string', '\'name\' must be a string');

	// determiner: 'must be' or 'must not be'
	let determiner;
	if (typeof expected === 'string' && expected.startsWith('not ')) {
		determiner = 'must not be';
		expected = expected.replace(/^not /, '');
	} else {
		determiner = 'must be';
	}

	let msg;
	if (name.endsWith(' argument')) {
		// For cases like 'first argument'
		msg = `The ${name} ${determiner} ${oneOf(expected, 'type')}`;
	} else {
		const type = name.includes('.') ? 'property' : 'argument';
		msg = `The "${name}" ${type} ${determiner} ${oneOf(expected, 'type')}`;
	}

	// TODO(BridgeAR): Improve the output by showing `null` and similar.
	msg += `. Received type ${typeof actual}`;
	return msg;
}, TypeError);

let maxStack_ErrorName;
let maxStack_ErrorMessage;
/**
 * Returns true if `err.name` and `err.message` are equal to engine-specific
 * values indicating max call stack size has been exceeded.
 * "Maximum call stack size exceeded" in V8.
 *
 * @param {Error} err The error to check
 * @returns {boolean}
 */
export function isStackOverflowError(err) {
	if (maxStack_ErrorMessage === undefined) {
		try {
			function overflowStack() {
				overflowStack();
			}
			overflowStack();
		} catch (e) {
			maxStack_ErrorMessage = e.message;
			maxStack_ErrorName = e.name;
		}
	}

	return err.name === maxStack_ErrorName && err.message === maxStack_ErrorMessage;
}

function oneOf(expected, thing) {
	assert(typeof thing === 'string', '`thing` has to be of type string');
	if (Array.isArray(expected)) {
		const len = expected.length;
		assert(len > 0, 'At least one expected value needs to be specified');
		expected = expected.map((i) => String(i));
		if (len > 2) {
			return `one of ${thing} ${expected.slice(0, len - 1).join(', ')}, or ` + expected[len - 1];
		} else if (len === 2) {
			return `one of ${thing} ${expected[0]} or ${expected[1]}`;
		} else {
			return `of ${thing} ${expected[0]}`;
		}
	} else {
		return `of ${thing} ${String(expected)}`;
	}
}
