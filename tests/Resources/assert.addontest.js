/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti, process */
/* eslint no-unused-expressions: "off" */
'use strict';
const should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars
let assert;

describe.only('assert', function () {
	it('should be required as core module', function () {
		assert = require('assert');
		assert.should.be.a.Function; // it's an alias for assert.ok
	});

	describe('#ok()', () => {
		it('is a function', () => {
			assert.ok.should.be.a.Function;
		});

		it('does not throw for true', () => {
			should.doesNotThrow(function () {
				assert.ok(true);
			});
		});

		// FIXME: Test with arrow functions in throws/doesNotThrow as should.js doesn't handle it
		it('does not throw for 1', () => {
			should.doesNotThrow(function () {
				assert.ok(1);
			});
		});

		it('throws AssertionError when no value argument is passed', () => {
			// FIXME: the version of assert in our should.js does not support object as second arg!
			// Can be regexp, function or Error type. Newer version in node (that we want to match) supports object!
			should.throws(function () {
				assert.ok();
			},
			function (err) {
				return err instanceof assert.AssertionError && err.message === 'No value argument passed to `assert.ok()`';
			});
		});

		it('throws AssertionError with custom message if supplied', () => {
			should.throws(function () {
				assert.ok(false, 'it\'s false');
			},
			function (err) {
				return err instanceof assert.AssertionError && err.message === 'it\'s false';
			});
		});

		// TODO: I think we may want to differ from Node explicitly here to avoid some nasty code
		// They actually read the input file in to determien the expression/line failing
		// older versions and browserify treat ok failing like `value == true` equality failure

		it('throws AssertionError with generated message for falsy expression', () => {
			// AssertionError: The expression evaluated to a falsy value:
			//
			//   assert.ok(typeof 123 === 'string')
			should.throws(function () {
				assert.ok(typeof 123 === 'string');
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('The expression evaluated to a falsy value:');
			});
		});

		it('throws AssertionError with generated message for false', () => {
			// AssertionError: The expression evaluated to a falsy value:
			//
			//   assert.ok(false)
			should.throws(function () {
				assert.ok(false);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('The expression evaluated to a falsy value:');
			});
		});

		it('throws AssertionError with generated message for falsy number', () => {
			// AssertionError: The expression evaluated to a falsy value:
			//
			//   assert.ok(0)
			should.throws(function () {
				assert.ok(0);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('The expression evaluated to a falsy value:');
			});
		});
	});

	describe('#equal()', () => {
		it('is a function', () => {
			assert.equal.should.be.a.Function;
		});

		it('does not throw for comparing 1 with 1', () => {
			should.doesNotThrow(function () {
				assert.equal(1, 1);
			});
		});

		it('does not throw for comparing 1 with \'1\'', () => {
			should.doesNotThrow(function () {
				assert.equal(1, '1');
			});
		});

		it('throws for comparing 1 with 2', () => {
			// AssertionError [ERR_ASSERTION]: Expected values to be loosely equal:
			//
			// 1 !== 2
			should.throws(function () {
				assert.equal(1, 2);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be loosely equal:');
			});
		});

		// TODO: Test with equivalent objects
	});

	describe('#strictEqual()', () => {
		it('is a function', () => {
			assert.strictEqual.should.be.a.Function;
		});

		it('does not throw for comparing 1 with 1', () => {
			should.doesNotThrow(function () {
				assert.strictEqual(1, 1);
			});
		});

		it('throws for comparing 1 with \'1\'', () => {
			should.throws(function () {
				assert.strictEqual(1, '1');
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly equal:');
			});
		});

		it('throws for comparing 1 with 2', () => {
			// AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
			//
			// 1 !== 2
			should.throws(function () {
				assert.strictEqual(1, 2);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly equal:');
			});
		});

		it('throws when comparing different strings', () => {
			// AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
			// + actual - expected
			//
			// + 'Hello foobar'
			// - 'Hello World!'
			//          ^
			should.throws(function () {
				assert.strictEqual('Hello foobar', 'Hello World!');
			}, function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly equal:');
			});
		});
	});

	describe('#notEqual()', () => {
		it('is a function', () => {
			assert.notEqual.should.be.a.Function;
		});

		it('does throw for comparing 1 with 1', () => {
			should.throws(function () {
				assert.notEqual(1, 1);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected "actual" to be loosely unequal to:');
			});
		});

		it('does throw for comparing 1 with \'1\'', () => {
			should.throws(function () {
				assert.notEqual(1, '1');
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected "actual" to be loosely unequal to:');
			});
		});

		it('does not throw for comparing 1 with 2', () => {
			should.doesNotThrow(function () {
				assert.notEqual(1, 2);
			});
		});

		// TODO: Test with equivalent objects
	});

	describe('#notStrictEqual()', () => {
		it('is a function', () => {
			assert.notStrictEqual.should.be.a.Function;
		});

		it('throws for comparing 1 with 1', () => {
			should.throws(function () {
				assert.notStrictEqual(1, 1);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected "actual" to be strictly unequal to:');
			});
		});

		it('does not throw for comparing 1 with \'1\'', () => {
			should.doesNotThrow(function () {
				assert.notStrictEqual(1, '1');
			});
		});

		it('does not throw for comparing 1 with 2', () => {
			should.doesNotThrow(function () {
				assert.notStrictEqual(1, 2);
			});
		});

		it('does not throw when comparing different strings', () => {
			should.doesNotThrow(function () {
				assert.notStrictEqual('Hello foobar', 'Hello World!');
			});
		});
	});

	describe('#fail()', () => {
		it('is a function', () => {
			assert.fail.should.be.a.Function;
		});

		it('throws with default error message with no arguments', () => {
			// AssertionError [ERR_ASSERTION]: Failed
			should.throws(function () {
				assert.fail();
			},
			function (err) {
				return err instanceof assert.AssertionError && err.message === 'Failed';
			});
		});

		it('throws AssertionError with given message string', () => {
			// AssertionError [ERR_ASSERTION]: boom
			should.throws(function () {
				assert.fail('boom');
			},
			function (err) {
				return err instanceof assert.AssertionError && err.message === 'boom';
			});
		});

		it('throws supplied Error', () => {
			// TypeError: need array
			should.throws(function () {
				assert.fail(new TypeError('need array'));
			},
			function (err) {
				return err instanceof TypeError && err.message === 'need array';
			});
		});
	});

	describe('#throws()', () => {
		it('is a function', () => {
			assert.throws.should.be.a.Function;
		});

		// TODO: Test for:
		// When no `expected` argument is given, treat like we only care whether an Error is thrown (not validating it)

		it('throws when function does not throw an Error', () => {
			should.throws(function () {
				assert.throws(
					() => 1
				);
			},
			function (error) {
				return error instanceof assert.AssertionError && error.message === 'Missing expected exception.';
			});
		});

		it('throws when first argument is not a function', () => {
			should.throws(function () {
				assert.throws(1, {});
			},
			function (error) {
				return error instanceof TypeError && error.message === 'The "fn" argument must be of type Function. Received type number';
			});
		});

		it('does not throw when validation function returns true', () => {
			should.doesNotThrow(function () {
				const err = new TypeError('Wrong value');
				err.code = 404;
				err.foo = 'bar';
				err.info = {
					nested: true,
					baz: 'text'
				};
				err.reg = /abc/i;

				assert.throws(
					() => { throw err; },
					function (error) {
						return error === err;
					}
				);
			});
		});

		it('does not throw when validation function is an arrow function and returns true', () => {
			should.doesNotThrow(function () {
				const err = new TypeError('Wrong value');
				err.code = 404;
				err.foo = 'bar';
				err.info = {
					nested: true,
					baz: 'text'
				};
				err.reg = /abc/i;

				assert.throws(
					() => { throw err; },
					error => error === err
				);
			});
		});

		it('throws when validation function returns false', () => {
			const err = new TypeError('Wrong value');
			err.code = 404;
			err.foo = 'bar';
			err.info = {
				nested: true,
				baz: 'text'
			};
			err.reg = /abc/i;
			should.throws(function () {
				assert.throws(
					() => { throw err; },
					function (error) {
						return false;
					}
				);
			},
			function (error) {
				return error === err;
			});
		});

		it('does not throw when matches Object', () => {
			should.doesNotThrow(function () {
				const err = new TypeError('Wrong value');
				err.code = 404;
				err.foo = 'bar';
				err.info = 'text';

				assert.throws(
					() => { throw err; },
					{
						name: 'TypeError',
						message: 'Wrong value',
						info: 'text'
					}
				);
			});
		});

		// FIXME: We don't do deep equality checks yet!
		it.skip('does not throw when matches Object deeply', () => {
			should.doesNotThrow(function () {
				const err = new TypeError('Wrong value');
				err.code = 404;
				err.foo = 'bar';
				err.info = {
					nested: true,
					baz: 'text'
				};
				err.reg = /abc/i;

				assert.throws(
					() => { throw err; },
					{
						name: 'TypeError',
						message: 'Wrong value',
						info: {
							nested: true,
							baz: 'text'
						}
						// Note that only properties on the validation object will be tested for.
						// Using nested objects requires all properties to be present. Otherwise
						// the validation is going to fail.
					}
				);
			});
		});

		it('throws when fails match against Object', () => {
			const err = new TypeError('Wrong value');
			err.code = 404;
			err.foo = 'bar';
			err.info = {
				nested: true,
				baz: 'text'
			};
			err.reg = /abc/i;
			should.throws(function () {
				assert.throws(
					() => { throw err; },
					{
						name: 'TypeError',
						message: 'Wrong message', // no match here
					}
				);
			},
			function (error) {
				// when there's a mis-match in Object property, throws an AssertionError
				// FIXME: test rest of message!
				// TODO: Test actual/expected properties!
				return error instanceof assert.AssertionError && error.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		// FIXME: We don't support this yet!
		it.skip('does not throw when matches Object using Regexp properties', () => {
			should.doesNotThrow(function () {
				const err = new TypeError('Wrong value');
				err.code = 404;
				err.foo = 'bar';
				err.info = {
					nested: true,
					baz: 'text'
				};
				err.reg = /abc/i;
				// Using regular expressions to validate error properties:
				assert.throws(
					() => { throw err; },
					{
						// The `name` and `message` properties are strings and using regular
						// expressions on those will match against the string. If they fail, an
						// error is thrown.
						name: /^TypeError$/,
						message: /Wrong/,
						foo: 'bar',
						info: {
							nested: true,
							// It is not possible to use regular expressions for nested properties!
							baz: 'text'
						},
						// The `reg` property contains a regular expression and only if the
						// validation object contains an identical regular expression, it is going
						// to pass.
						reg: /abc/i
					}
				);
			});
		});

		it('does not throw when matches Error instance', () => {
			should.doesNotThrow(function () {
				const err = new TypeError('Wrong value');
				err.code = 404;
				err.foo = 'bar';
				err.info = {
					nested: true,
					baz: 'text'
				};
				err.reg = /abc/i;

				assert.throws(
					() => { throw err; },
					err
				);
			});
		});

		it('throws when fails match against Error instance with differing name or message properties', () => {
			should.throws(function () {
				const err = new TypeError('Wrong value');
				err.code = 404;
				// Fails due to the different `message` and `name` properties:
				assert.throws(
					() => {
						const otherErr = new Error('Not found');
						otherErr.code = 404;
						throw otherErr;
					},
					err // This tests for `message`, `name` and `code`.
				);
			},
			function (err) {
				// when there's a mis-match in Object property, throws an AssertionError
				// FIXME: test rest of message!
				// TODO: Test actual/expected properties!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('does not throw when matches Error type', () => {
			should.doesNotThrow(function () {
				assert.throws(
					() => { throw new TypeError('Wrong value'); },
					TypeError
				);
			});
		});

		it('throws when fails match against Error type', () => {
			should.throws(function () {
				assert.throws(
					() => { throw new Error('Not found'); },
					TypeError
				);
			},
			function (err) {
				// re-throws underlying Error thrown
				return err instanceof Error && err.message === 'Not found';
			});
		});

		it('does not throw when matches RegExp', () => {
			should.doesNotThrow(function () {
				assert.throws(
					() => { throw new Error('Wrong value'); },
					/^Error: Wrong value$/
				);
			});
		});

		it('throws when fails match against RegExp', () => {
			should.throws(function () {
				assert.throws(
					() => { throw new Error('Wrong value'); },
					/^Error: Wrong match$/
				);
			},
			function (err) {
				// re-throws underlying Error thrown
				return err instanceof Error && err.message === 'Wrong value';
			});
		});
	});

	describe('#doesNotThrow()', () => {
		it('is a function', () => {
			assert.throws.should.be.a.Function;
		});

		it('throws underlying Error when expected type does not match', () => {
			should.throws(function () {
				assert.doesNotThrow(
					() => { throw new TypeError('Wrong value'); },
					SyntaxError
				);
			},
			function (err) {
				// re-throws underlying Error thrown
				return err instanceof TypeError && err.message === 'Wrong value';
			});
		});

		it('throws AssertionError when expected type does match', () => {
			should.throws(function () {
				assert.doesNotThrow(
					() => { throw new TypeError('Wrong value'); },
					TypeError
				);
			},
			function (err) {
				return err instanceof assert.AssertionError && err.message === 'Got unwanted exception.';
			});
		});

		it('throws underlying Error when RegExp does not match', () => {
			should.throws(function () {
				assert.doesNotThrow(
					() => { throw new TypeError('Wrong value'); },
					/Wrong match/
				);
			},
			function (err) {
				// re-throws underlying Error thrown
				return err instanceof TypeError && err.message === 'Wrong value';
			});
		});

		it('throws AssertionError when RegExp matches', () => {
			should.throws(function () {
				assert.doesNotThrow(
					() => { throw new TypeError('Wrong value'); },
					/Wrong value/
				);
			},
			function (err) {
				return err instanceof assert.AssertionError && err.message === 'Got unwanted exception.';
			});
		});

		it('throws underlying Error when matching function returns false', () => {
			should.throws(function () {
				assert.doesNotThrow(
					() => { throw new TypeError('Wrong value'); },
					function (err) {
						return err instanceof TypeError && err.message === 'Wrong match';
					}
				);
			},
			function (err) {
				// re-throws underlying Error thrown
				return err instanceof TypeError && err.message === 'Wrong value';
			});
		});

		it('throws AssertionError when matching function returns true', () => {
			should.throws(function () {
				assert.doesNotThrow(
					() => { throw new TypeError('Wrong value'); },
					function (err) {
						return err instanceof TypeError && err.message === 'Wrong value';
					}
				);
			},
			function (err) {
				return err instanceof assert.AssertionError && err.message === 'Got unwanted exception.';
			});
		});

		it('throws AssertionError with custom message when does match', () => {
			should.throws(function () {
				assert.doesNotThrow(
					() => { throw new TypeError('Wrong value'); },
					/Wrong value/,
					'Whoops'
				);
			},
			function (err) {
				return err instanceof assert.AssertionError && err.message === 'Got unwanted exception: Whoops';
			});
		});
	});

	describe('.strict', () => {
		it('is a function', function () {
			assert.strict.should.be.a.Function; // it's an alias for assert.ok
		});

		describe('#equal()', () => {
			it('does throw for comparing 1 with \'1\'', () => {
				should.throws(function () {
					assert.strict.equal(1, '1');
				},
				function (err) {
					// TODO: Test for rest of error message diff!
					return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly equal:');
				});
			});
		});
		// TODO: Add tests for strict notEqual(), deepEqual(), deepNotEqual()
	});
});
