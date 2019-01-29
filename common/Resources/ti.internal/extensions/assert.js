'use strict';

const kReadableOperator = {
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

class AssertionError extends Error {
	constructor(options) {
		let {
			actual,
			expected,
			message,
			operator,
			stackStartFn
		} = options;
		if (!message) {
			// FIXME: Generate the rest of the message with diff of actual/expected!
			message = `${kReadableOperator[operator]}\n\n`;
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

const isRegexp = value => Object.prototype.toString.call(value) === '[object RegExp]';

function checkError(actual, expected, message) {
	// What we do here depends on what err is:
	// function - call it to validate
	// object - test properties against actual
	// Regexp - test against actual.toString()
	// Error type - check type matches
	// Error instance - compare properties
	if (typeof expected === 'object') {
		if (isRegexp(expected)) {
			return expected.test(actual); // does the error match the RegExp expression? if so, pass
		}

		// Test properties (`expected` is either a generic Object or an Error instance)
		const keys = Object.keys(expected);
		// If we're testing against an instance of an Error, we need to hack in name/message properties.
		if (expected instanceof Error) {
			keys.unshift('name', 'message'); // we want to compare name and message, but they're not set as enumerable on Error
		}
		for (const key in keys) {
			if (actual[key] !== expected[key]) {
				throwError({
					actual,
					expected,
					message,
					operator: 'throws',
					stackStartFn: assert.throws
				});
				return;
			}
		}

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
// assert.doesNotThrow(fn[, error][, message])
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
