'use strict';

const util = require('./util');

const DEFAULT_MESSAGES = {
	deepStrictEqual: 'Expected values to be strictly deep-equal:',
	strictEqual: 'Expected values to be strictly equal:',
	strictEqualObject: 'Expected "actual" to be reference-equal to "expected":',
	deepEqual: 'Expected values to be loosely deep-equal:',
	equal: 'Expected values to be loosely equal:',
	notDeepStrictEqual: 'Expected "actual" not to be strictly deep-equal to:',
	notStrictEqual: 'Expected "actual" to be strictly unequal to:',
	notStrictEqualObject: 'Expected "actual" not to be reference-equal to "expected":',
	notDeepEqual: 'Expected "actual" not to be loosely deep-equal to:',
	notEqual: 'Expected "actual" to be loosely unequal to:',
	notIdentical: 'Values identical but not reference-equal:',
};

const COMPARE_TYPE = {
	Object,
	Map,
	Set
};

class AssertionError extends Error {
	constructor(options) {
		let {
			actual,
			expected,
			message,
			operator
		} = options;
		if (!message) {
			// FIXME: Generate the rest of the message with diff of actual/expected!
			message = `${DEFAULT_MESSAGES[operator]}\n\n`;
		}
		super(message);
		this.actual = actual;
		this.expected = expected;
		this.operator = operator;
		this.generatedMessage = !message;
		this.name = 'AssertionError [ERR_ASSERTION]';
		this.code = 'ERR_ASSERTION';
	}
}
const assert = (value, message) => assert.ok(value, message);
assert.AssertionError = AssertionError;
assert.ok = (...args) => {
	const value = args[0];
	if (value) {
		return;
	}

	let message = args[1];
	let generatedMessage = false;

	// Check if value (1st arg) was not supplied!
	// Have to use ugly hack on args definition to do so
	if (args.length === 0) {
		message = 'No value argument passed to `assert.ok()`';
		generatedMessage = true;
	} else if (message == null) { // eslint-disable-line no-eq-null,eqeqeq
		// TODO: generate rest of the message. Node actually reads the input file! The hacked browserify does not do this
		// It treates ok failing like `value == true` failing
		message = 'The expression evaluated to a falsy value:\n\n';
		generatedMessage = true;
	} else if (message instanceof Error) {
		throw message;
	}

	const err = new AssertionError({
		actual: value,
		expected: true,
		message,
		operator: '=='
	});
	err.generatedMessage = generatedMessage;
	throw err;
};

function throwError(obj) {
	// If message is an Error object, throw that instead!
	if (obj.message instanceof Error) {
		throw obj.message;
	}

	throw new AssertionError(obj);
}

assert.equal = (actual, expected, message) => {
	if (actual == expected) { // eslint-disable-line eqeqeq
		return;
	}

	throwError({
		actual, expected, message, operator: 'equal'
	});
};

assert.strictEqual = (actual, expected, message) => {
	if (Object.is(actual, expected)) { // provides SameValue comparison for us
		return;
	}

	throwError({
		actual, expected, message, operator: 'strictEqual'
	});
};

assert.notEqual = (actual, expected, message) => {
	if (actual != expected) { // eslint-disable-line eqeqeq
		return;
	}

	throwError({
		actual, expected, message, operator: 'notEqual'
	});
};

assert.notStrictEqual = (actual, expected, message) => {
	if (!Object.is(actual, expected)) { // provides SameValue comparison for us
		return;
	}

	throwError({
		actual, expected, message, operator: 'notStrictEqual'
	});
};

const isPrimitive = value => {
	return (typeof value !== 'object' && typeof value !== 'function') || value === null;
};

/**
 * @param {Map} actual map we are comparing
 * @param {Map} expected map we're comparing against
 * @param {object} references memoized references to objects in the deepEqual hierarchy
 * @returns {boolean}
 */
function compareMaps(actual, expected, references) {
	const objectKeys = new Set(); // keep track of objects we need to test more extensively than using #get()
	for (const [key, value] of actual) {
		if (typeof key === 'object' && key !== null) {
			// non-null object. We need to do our own checking, not use get()
			objectKeys.add(value);
		} else {
			// handle "primitives"
			if (!expected.has(key)) {
				return false; // second Map doesn't have the key, fail
			}
			// does value match?
			const expectedValue = expected.get(key);
			if (!deepEqual(value, expectedValue, references)) {
				return false;
			}
		}
	}

	if (objectKeys.size > 0) {
		// only go through the second Map once!
		for (const [expectedKey, expectedValue] of expected) {
			if (typeof expectedKey === 'object' && expectedKey !== null) {
				// it's a non-null object in second Map
				// see if it's in our `objectKeys` set
				let found = false;
				for (const key of objectKeys) {
					// if both key and value matches
					if (deepEqual(key, expectedKey, references)
						&& deepEqual(actual.get(key), expectedValue, references)) {
						found = true;
						objectKeys.delete(key); // remove from our objectKeys Set since we already matched it
						break;
					}
				}
				// if not found, we failed to match
				if (!found) {
					return false;
				}
			}
		}
		// did we leave un-matched keys?
		if (objectKeys.size !== 0) {
			return false;
		}
	}
	return true;
}

/**
 * @param {Set} actual map we are comparing
 * @param {Set} expected map we're comparing against
 * @param {object} references memoized references to objects in the deepEqual hierarchy
 * @returns {boolean}
 */
function compareSets(actual, expected, references) {
	const objects = new Set(); // keep track of objects we need to test more extensively than using #has()
	for (const value of actual) {
		if (typeof value === 'object' && value !== null) {
			// non-null object. We need to do our own checking, not use has()
			objects.add(value);
		} else if (!expected.has(value)) {
			// FIXME: has does "same-value-zero" check, which is like Object.is except for -0/+0 being considered equal
			// so may need to special case that here
			return false;
		}
	}

	if (objects.size > 0) {
		// only go through the second Set once!
		for (const expectedEntry of expected) {
			if (typeof expectedEntry === 'object' && expectedEntry !== null) {
				// it's a non-null object in second Set
				// see if it's in our `objects` set
				let found = false;
				for (const object of objects) {
					if (deepEqual(object, expectedEntry, references)) {
						found = true; // found a match!
						objects.delete(object); // remove from our objects Set since we already matched it
						break;
					}
				}
				// if not found, we failed to match
				if (!found) {
					return false;
				}
			}
		}
		// did we leave un-match objects?
		if (objects.size !== 0) {
			return false;
		}
	}
	return true;
}

/**
 * @param {*} actual
 * @param {*} expected
 * @param {object} [references]
 * @param {Map<object,number>} [references.actual]
 * @param {Map<object,number>} [references.expected]
 * @param {number} [references.depth]
 * @returns {boolean}
 */
function deepEqual(actual, expected, references) {
	// if primitives, compare using Object.is
	// This handles: null, undefined, number, string, boolean
	if (isPrimitive(actual) && isPrimitive(expected)) {
		return Object.is(actual, expected); // TODO: If doing "loose" equality check, use ===
	}

	// Now we have various objects/functions:
	// Date, Error, RegExp, Array, Map, Set, Object, Function, Arrow functions, WeakMap, DataView, ArrayBuffer, WeakSet, typed arrays
	// notably, this includes "boxed" primitives created by new Boolean(false), new String('value'), Symbol('whatever'), etc

	// Type tags of objects should be the same
	const actualTag = Object.prototype.toString.call(actual);
	const expectedTag = Object.prototype.toString.call(expected);
	if (actualTag !== expectedTag) {
		return false;
	}

	// [[Prototype]] of objects are compared using the Strict Equality Comparison.
	const actualPrototype = Object.getPrototypeOf(actual);
	const expectedPrototype = Object.getPrototypeOf(expected);
	if (actualPrototype !== expectedPrototype) {
		return false;
	}

	let comparison = COMPARE_TYPE.Object;
	if (util.types.isRegexp(actual)) { // RegExp source and flags should match
		if (!util.types.isRegexp(expected) || actual.flags !== expected.flags || actual.source !== expected.source) {
			return false;
		}
		// continue on to check properties...
	} else if (util.types.isDate(actual)) { // Date's underlying time should match
		if (!util.types.isDate(expected) || actual.getTime() !== expected.getTime()) {
			return false;
		}
		// continue on to check properties...
	} else if (actual instanceof Error) { // Error's name and message must match
		if (!(expected instanceof Error) || actual.name !== expected.name || actual.message !== expected.message) {
			return false;
		}
		// continue on to check properties...
	} else if (Array.isArray(actual)) { // if array lengths differ, quick fail
		if (!Array.isArray(expected) || actual.length !== expected.length) {
			return false;
		}
		// continue on to check properties...
	} else if (util.types.isBoxedPrimitive(actual)) {
		if (!util.types.isBoxedPrimitive(expected)) {
			return false;
		}
		// check that they're the same type of wrapped primitive and then call the relevant valueOf() for that type to compare them!
		if (util.types.isNumberObject(actual)
			&& (!util.types.isNumberObject(expected)
				|| !Object.is(Number.prototype.valueOf.call(actual), Number.prototype.valueOf.call(expected)))) {
			return false;
		} else if (util.types.isStringObject(actual)
			&& (!util.types.isStringObject(expected)
				|| String.prototype.valueOf.call(actual) !== String.prototype.valueOf.call(expected))) {
			return false;
		} else if (util.types.isBooleanObject(actual)
			&& (!util.types.isBooleanObject(expected)
				|| Boolean.prototype.valueOf.call(actual) !== Boolean.prototype.valueOf.call(expected))) {
			return false;
		} else if (util.types.isBigIntObject(actual)
			&& (!util.types.isBigIntObject(expected)
				|| BigInt.prototype.valueOf.call(actual) !== BigInt.prototype.valueOf.call(expected))) {
			return false;
		} else if (util.types.isSymbolObject(actual)
			&& (!util.types.isSymbolObject(expected)
				|| Symbol.prototype.valueOf.call(actual) !== Symbol.prototype.valueOf.call(expected))) {
			return false;
		}
		// continue on to check properties...
	} else if (util.types.isSet(actual)) {
		if (!util.types.isSet(expected) || actual.size !== expected.size) {
			return false;
		}
		comparison = COMPARE_TYPE.Set;
		// continue on to check properties...
	} else if (util.types.isMap(actual)) {
		if (!util.types.isMap(expected) || actual.size !== expected.size) {
			return false;
		}
		comparison = COMPARE_TYPE.Map;
		// continue on to check properties...
	}

	// Now iterate over properties and compare them!
	const actualKeys = Object.keys(actual); // for an array, this will return the indices that have values
	const expectedKeys = Object.keys(expected); // and it just magically works
	// Must have same number of properties
	if (actualKeys.length !== expectedKeys.length) {
		return false;
	}

	// Are they the same keys? If one is missing, then no, fail right away
	if (!actualKeys.every(key => Object.prototype.hasOwnProperty.call(expected, key))) {
		return false;
	}

	const actualSymbols = Object.getOwnPropertySymbols(actual);
	const expectedSymbols = Object.getOwnPropertySymbols(expected);

	// Must have same number of symbols
	if (actualSymbols.length !== expectedSymbols.length) {
		return false;
	}

	if (actualSymbols.length > 0) {
		// Have to filter them down to enumerable symbols!
		for (const key of actualSymbols) {
			const actualIsEnumerable = Object.prototype.propertyIsEnumerable.call(actual, key);
			const expectedIsEnumerable = Object.prototype.propertyIsEnumerable.call(expected, key);
			if (actualIsEnumerable !== expectedIsEnumerable) {
				return false; // they differ on whetehr symbol is enumerable, fail!
			} else if (actualIsEnumerable) {
				// it's enumerable, add to keys to check
				actualKeys.push(key);
				expectedKeys.push(key);
			}
		}
	}

	// Avoid circular references!
	// Record map from objects to depth in the hierarchy
	if (references === undefined) {
		references = {
			actual: new Map(),
			expected: new Map(),
			depth: 0
		};
	} else {
		// see if we've already recorded these objects.
		// if so, make sure they refer to same depth in object hierarchy
		const memoizedActual = references.actual.get(actual);
		if (memoizedActual !== undefined) {
			const memoizedExpected = references.expected.get(expected);
			if (memoizedExpected !== undefined) {
				return memoizedActual === memoizedExpected;
			}
		}
		references.depth++;
	}
	// store the object -> depth mapping
	references.actual.set(actual, references.depth);
	references.expected.set(expected, references.depth);

	// When comparing Maps/Sets, compare elements before custom properties
	let result = true;
	if (comparison === COMPARE_TYPE.Set) {
		result = compareSets(actual, expected, references);
	} else if (comparison === COMPARE_TYPE.Map) {
		result = compareMaps(actual, expected, references);
	}
	if (result) {
		// Now loop over keys and compare them to each other!
		for (const key of actualKeys) {
			if (!deepEqual(actual[key], expected[key], references)) {
				result = false;
				break;
			}
		}
	}
	// wipe the object to depth mapping for these objects now
	references.actual.delete(actual);
	references.expected.delete(expected);
	return result;
}

assert.deepStrictEqual = (actual, expected, message) => {
	if (!deepEqual(actual, expected)) {
		throwError({
			actual, expected, message, operator: 'deepStrictEqual'
		});
	}
};

assert.fail = (message = 'Failed') => throwError({ message });

const NO_EXCEPTION = {};
function execute(fn) {
	const fnType = typeof fn;
	if (fnType !== 'function') {
		throw new TypeError(`The "fn" argument must be of type Function. Received type ${fnType}`);
	}
	try {
		fn();
	} catch (e) {
		return e;
	}
	return NO_EXCEPTION;
}

assert.throws = (fn, error, message) => {
	const actual = execute(fn);
	if (actual === NO_EXCEPTION) {
		// FIXME: append message if not null
		throwError({
			actual: undefined, expected: error, message: 'Missing expected exception.', operator: 'throws'
		});
		return;
	}

	// They didn't specify how to validate, so just roll with it
	if (!error) {
		return;
	}

	if (!checkError(actual, error, message)) {
		throw actual; // throw the Error it did generate
	}
};

assert.doesNotThrow = (fn, error, message) => {
	const actual = execute(fn);
	// no Error, just return
	if (actual === NO_EXCEPTION) {
		return;
	}

	// They didn't specify how to validate, so just re-throw
	if (!error) {
		throw actual;
	}

	// If error matches expected, throw an AssertionError
	if (checkError(actual, error)) {
		throwError({
			actual,
			expected: error,
			operator: 'doesNotThrow',
			message: `Got unwanted exception${message ? (': ' + message) : '.'}`
		});
		return;
	}
	// doesn't match, re-throw
	throw actual;
};

/**
 * @param {Error} actual the actual Error generated by the wrapped function/block
 * @param {object|RegExp|Function|Error|Class} expected The value to test against the Error
 * @param {string} [message] custom message to append
 * @returns {boolean} true if the Error matches the expected value/object
 */
function checkError(actual, expected, message) {
	// What we do here depends on what err is:
	// function - call it to validate
	// object - test properties against actual
	// Regexp - test against actual.toString()
	// Error type - check type matches
	// Error instance - compare properties
	if (typeof expected === 'object') {
		if (util.types.isRegexp(expected)) {
			return expected.test(actual); // does the error match the RegExp expression? if so, pass
		}

		// Test properties (`expected` is either a generic Object or an Error instance)
		const keys = Object.keys(expected);
		// If we're testing against an instance of an Error, we need to hack in name/message properties.
		if (expected instanceof Error) {
			keys.unshift('name', 'message'); // we want to compare name and message, but they're not set as enumerable on Error
		}
		for (const key of keys) {
			console.log(`Comparing values for key: ${key}. actual: ${actual[key]}, expected: ${expected[key]}`);
			if (!deepEqual(actual[key], expected[key])) {
				if (!message) {
					// generate a meaningful message! Cheat by treating like equality check of values
					// then steal the message it generated
					try {
						throwError({
							actual: actual[key],
							expected: expected[key],
							operator: 'deepStrictEqual'
						});
					} catch (err) {
						message = err.message;
					}
				}
				throwError({
					actual,
					expected,
					message,
					operator: 'throws'
				});
				return false;
			}
		}
		return true; // They all matched, pass!
	} else if (typeof expected === 'function') {
		// if `expected` is a "type" and actual is an instance of that type, then pass
		if (expected.prototype != null && actual instanceof expected) { // eslint-disable-line no-eq-null,eqeqeq
			return true;
		}

		// If `expected` is a subclass of Error but `actual` wasn't an instance of it (above), fail
		if (Error.isPrototypeOf(expected)) {
			return false;
		}

		// ok, let's assume what's left is that `expected` was a validation function,
		// so call it with empty `this` and single argument of the actual error we received
		return expected.call({}, actual);
	}
	return false;
}

// TODO:
// assert.deepEqual(actual, expected[, message])
// assert.deepStrictEqual(actual, expected[, message])
// assert.doesNotReject(asyncFn[, error][, message])
// assert.ifError(value)
// assert.notDeepEqual(actual, expected[, message])
// assert.notDeepStrictEqual(actual, expected[, message])
// assert.rejects(asyncFn[, error][, message])

// Create "strict" copy which overrides "loose" methods to call strict equivalents
assert.strict = (value, message) => assert.ok(value, message);
assert.strict.deepEqual = assert.deepStrictEqual;
assert.strict.notDeepEqual = assert.notDeepStrictEqual;
assert.strict.equal = assert.strictEqual;
assert.strict.notEqual = assert.notStrictEqual;
assert.strict.strict = assert.strict;

module.exports = assert;
