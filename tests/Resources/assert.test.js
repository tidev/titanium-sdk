/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2019-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint node/no-deprecated-api: "off"  */
/* eslint node/no-unsupported-features/node-builtins: "off" */
'use strict';
const should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars
let assert;

// possible test cases:
// https://github.com/nodejs/node/blob/master/test/parallel/test-assert-deep.js
// https://github.com/nodejs/node/blob/master/test/parallel/test-assert.js

describe('assert', function () {
	it('should be required as core module', function () {
		assert = require('assert');
		assert.should.be.a.Function(); // it's an alias for assert.ok
	});

	describe('#ok()', () => {
		it('is a function', () => {
			assert.ok.should.be.a.Function();
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
			assert.equal.should.be.a.Function();
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
			assert.strictEqual.should.be.a.Function();
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
			assert.notEqual.should.be.a.Function();
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
			assert.notStrictEqual.should.be.a.Function();
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
			assert.fail.should.be.a.Function();
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
			assert.throws.should.be.a.Function();
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
					function (_error) {
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

		it('does not throw when matches Object deeply', () => {
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
		it.allBroken('does not throw when matches Object using Regexp properties', () => {
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
			assert.throws.should.be.a.Function();
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

	describe('#rejects()', () => {
		it('is a function', () => {
			assert.rejects.should.be.a.Function();
		});

		it('resolves when given a Promise that rejects', finished => {
			assert.rejects(
				Promise.reject(new Error('Wrong value'))
			).then(() => {
				return finished();
			}).catch(err => finished(err));
		});

		// TODO: Test with message arg!

		it('resolves when given a Promise that rejects expected Error type', finished => {
			assert.rejects(
				Promise.reject(new Error('Wrong value')),
				Error
			).then(() => {
				return finished();
			}).catch(err => finished(err));
		});

		it('rejects with actual Error when given a Promise that rejects unexpected Error type', finished => {
			const actualError = new Error('Wrong value');
			assert.rejects(
				Promise.reject(actualError),
				TypeError
			).then(() => {
				return finished(new Error('Expected assert.rejects to bubble up underlying Error to catch handler'));
			}).catch(err => {
				err.should.eql(actualError);
				finished();
			});
		});

		it('rejects with AssertionError when given a Promise that resolves', finished => {
			assert.rejects(
				Promise.resolve(1)
			).then(() => {
				return finished(new Error('Expected assert.rejects to reject with Error to catch handler if supplied Promise resolves'));
			}).catch(err => {
				err.should.be.ok();
				(err instanceof assert.AssertionError).should.be.true();
				finished();
			});
		});
	});

	describe('#doesNotReject()', () => {
		it('is a function', () => {
			assert.doesNotReject.should.be.a.Function();
		});

		// TODO: Add some basic tests!
		it('rejects with actual Error when given a Promise that rejects', finished => {
			const actualError = new Error('Wrong value');
			assert.doesNotReject(
				Promise.reject(actualError)
			).then(() => {
				return finished(new Error('Expected assert.doesNotReject to bubble up underlying Error to catch handler'));
			}).catch(err => {
				err.should.eql(actualError);
				finished();
			});
		});

		it('rejects with AssertionError when given a Promise that rejects expected Error type', finished => {
			const actualError = new Error('Wrong value');
			assert.doesNotReject(
				Promise.reject(actualError),
				Error
			).then(() => {
				return finished(new Error('Expected assert.doesNotReject to reject with AssertionError to catch handler'));
			}).catch(err => {
				err.should.not.eql(actualError);
				(err instanceof assert.AssertionError).should.be.true();
				finished();
			});
		});

		it('rejects with actual Error when given a Promise that rejects unexpected Error type', finished => {
			const actualError = new Error('Wrong value');
			assert.doesNotReject(
				Promise.reject(actualError),
				TypeError
			).then(() => {
				return finished(new Error('Expected assert.doesNotReject to bubble up underlying Error to catch handler'));
			}).catch(err => {
				err.should.eql(actualError);
				finished();
			});
		});

		it('resolves when given a Promise that resolves', finished => {
			assert.doesNotReject(
				Promise.resolve('abc')
			).then(() => {
				return finished();
			}).catch(err => finished(err));
		});
	});

	describe('#deepStrictEqual()', () => {
		it('is a function', function () {
			assert.deepStrictEqual.should.be.a.Function();
		});

		it('throws for comparing 1 with \'1\' as values of same key on objects', () => {
			should.throws(function () {
				assert.deepStrictEqual({ a: 1 }, { a: '1' });
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('does not throw for comparing NaN to NaN', () => {
			should.doesNotThrow(function () {
				assert.deepStrictEqual(NaN, NaN);
			});
		});

		it('does not throw for comparing -0 to -0', () => {
			should.doesNotThrow(function () {
				assert.deepStrictEqual(-0, -0);
			});
		});

		it('throws for comparing 0 with -0', () => {
			should.throws(function () {
				assert.deepStrictEqual(0, -0);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('throws for comparing 4 with \'4\'', () => {
			should.throws(function () {
				assert.deepStrictEqual(4, '4');
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('throws for comparing true with 1', () => {
			should.throws(function () {
				assert.deepStrictEqual(true, 1);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('does not throw for object with same symbol key', () => {
			should.doesNotThrow(function () {
				const symbol1 = Symbol();
				assert.deepStrictEqual({ [symbol1]: 1 }, { [symbol1]: 1 });
			});
		});

		it('does throw for objects with different symbol property keys', () => {
			should.throws(function () {
				const symbol1 = Symbol();
				const symbol2 = Symbol();
				assert.deepStrictEqual({ [symbol1]: 1 }, { [symbol2]: 1 });
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('does throw for wrapped numbers with different underlying values', () => {
			should.throws(function () {
				assert.deepStrictEqual(new Number(1), new Number(2)); // eslint-disable-line no-new-wrappers
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('does not throw for wrapped strings with same underlying values', () => {
			should.doesNotThrow(function () {
				assert.deepStrictEqual(new String('foo'), Object('foo')); // eslint-disable-line no-new-wrappers
			});
		});

		it('does throw for objects with differing prototypes', () => {
			should.throws(function () {
				const object = {};
				const fakeDate = {};
				Object.setPrototypeOf(fakeDate, Date.prototype);
				assert.deepStrictEqual(object, fakeDate);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('does throw for objects with differing type tags', () => {
			should.throws(function () {
				const date = new Date();
				const fakeDate = {};
				Object.setPrototypeOf(fakeDate, Date.prototype);

				// Different type tags:
				assert.deepStrictEqual(date, fakeDate);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('does throw for Dates with differing getTime() values', () => {
			should.throws(function () {
				const date1 = new Date();
				const date2 = new Date();
				date2.setTime(0);
				assert.deepStrictEqual(date1, date2);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('does not throw for Dates with same getTime() values', () => {
			should.doesNotThrow(function () {
				const date1 = new Date();
				const date2 = new Date();
				date1.setTime(0);
				date2.setTime(0);
				assert.deepStrictEqual(date1, date2);
			});
		});

		it('does not throw for Array with same values', () => {
			should.doesNotThrow(function () {
				assert.deepStrictEqual([ 3, 2, 1 ], [ 3, 2, 1 ]);
			});
		});

		it('throws for Array with differing values', () => {
			should.throws(function () {
				assert.deepStrictEqual([ 1, 2, 3 ], [ 4, 5, 6 ]);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('throws for Array with same values in differing order', () => {
			should.throws(function () {
				assert.deepStrictEqual([ 1, 2, 3 ], [ 3, 2, 1 ]);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('throws for Array with different lengths', () => {
			should.throws(function () {
				assert.deepStrictEqual([ 1, 2, 3 ], [ 1, 2, 3, 4 ]);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('does not throw for Regexp with same value', () => {
			should.doesNotThrow(function () {
				assert.deepStrictEqual(/a/, /a/);
			});
		});

		it('does not throw for Regexp with same value and flags', () => {
			should.doesNotThrow(function () {
				assert.deepStrictEqual(/a/igm, /a/igm);
			});
		});

		it('throws for RegExp with different flags', () => {
			should.throws(function () {
				assert.deepStrictEqual(/a/ig, /a/im);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('does not throw for sparse Array with same values', () => {
			should.doesNotThrow(function () {
				assert.deepStrictEqual([ 1, , , 3 ], [ 1, , , 3 ]); // eslint-disable-line no-sparse-arrays
			});
		});

		it('throws for sparse Arrays with different holes', () => {
			should.throws(function () {
				assert.deepStrictEqual([ 1, , , 3 ], [ 1, , , 3, , , ]); // eslint-disable-line no-sparse-arrays
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('throws for inconsistent circular structures', () => {
			should.throws(function () {
				const d = {};
				d.a = 1;
				d.b = d;
				const e = {};
				e.a = 1;
				e.b = {};
				assert.deepStrictEqual(d, e);
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('does not throw for circular structure that is equivalent', () => {
			should.doesNotThrow(function () {
				const b = {};
				b.b = b;
				const c = {};
				c.b = c;
				assert.deepStrictEqual(b, c);
			});
		});

		it('does not throw for comparing two empty Sets', () => {
			should.doesNotThrow(function () {
				assert.deepStrictEqual(new Set(), new Set());
			});
		});

		it('does not throw for comparing two Sets with same values', () => {
			should.doesNotThrow(function () {
				assert.deepStrictEqual(new Set([ 1, 2, 3 ]), new Set([ 1, 2, 3 ]));
			});
		});

		it('throws for Sets with different sizes', () => {
			should.throws(function () {
				assert.deepStrictEqual(new Set([ 1, 2, 3, 4 ]), new Set([ 1, 2, 3 ]));
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('throws for Sets with differing objects as values', () => {
			should.throws(function () {
				assert.deepStrictEqual(new Set([ { a: 0 } ]), new Set([ { a: 1 } ]));
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		it('does not throw for comparing two Sets with same values in different order', () => {
			should.doesNotThrow(function () {
				assert.deepStrictEqual(new Set([ [ 1, 2 ], [ 3, 4 ] ]), new Set([ [ 3, 4 ], [ 1, 2 ] ]));
			});
		});

		it('does not throw for comparing two empty Maps', () => {
			should.doesNotThrow(function () {
				assert.deepStrictEqual(new Map(), new Map());
			});
		});

		it('does not throw for comparing Maps with same key/value pairs', () => {
			should.doesNotThrow(function () {
				assert.deepStrictEqual(new Map([ [ 1, 1 ], [ 2, 2 ] ]), new Map([ [ 1, 1 ], [ 2, 2 ] ]));
			});
		});

		it('does not throw for comparing Maps with same key/value pairs in different order', () => {
			should.doesNotThrow(function () {
				assert.deepStrictEqual(new Map([ [ 1, 1 ], [ 2, 2 ] ]), new Map([ [ 2, 2 ], [ 1, 1 ] ]));
			});
		});

		it('throws for Maps with differing key/value pairs', () => {
			should.throws(function () {
				assert.deepStrictEqual(new Map([ [ 1, 1 ], [ 2, 2 ] ]), new Map([ [ 1, 2 ], [ 2, 1 ] ]));
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be strictly deep-equal:');
			});
		});

		// TODO: Test:
		// Symbols
		// BigInts
	});

	describe('#deepEqual()', () => {
		it('is a function', function () {
			assert.deepEqual.should.be.a.Function();
		});

		it('does not throw for comparing 1 with \'1\' as values of same key on objects', () => {
			should.doesNotThrow(function () {
				assert.deepEqual({ a: 1 }, { a: '1' });
			},
			function (err) {
				// TODO: Test for rest of error message diff!
				return err instanceof assert.AssertionError && err.message.startsWith('Expected values to be loosely deep-equal:');
			});
		});

		it('does not throw for comparing 0 with -0', () => {
			should.doesNotThrow(function () {
				assert.deepEqual(0, -0);
			});
		});

		it('does not throw for comparing -0 with -0', () => {
			should.doesNotThrow(function () {
				assert.deepEqual(-0, -0);
			});
		});

		it('does not throw for comparing 4 with \'4\'', () => {
			should.doesNotThrow(function () {
				assert.deepEqual(4, '4');
			});
		});

		it('does not throw for comparing true with 1', () => {
			should.doesNotThrow(function () {
				assert.deepEqual(true, 1);
			});
		});

		it('does not throw for comparing Set with 1 and \'1\'', () => {
			should.doesNotThrow(function () {
				assert.deepEqual(new Set([ '1' ]), new Set([ 1 ]));
			});
		});

		it('does not throw for comparing Map with keys 1 and \'1\'', () => {
			should.doesNotThrow(function () {
				assert.deepEqual(new Map([ [ '1', 'a' ] ]), new Map([ [ 1, 'a' ] ]));
			});
		});

		it('does not throw for comparing Map with values 1 and \'1\'', () => {
			should.doesNotThrow(function () {
				assert.deepEqual(new Map([ [ 'a', '1' ] ]), new Map([ [ 'a', 1 ] ]));
			});
		});

		// TODO: Test specific cases where deepEqual passes but deepStrictEqual doesn't!
	});

	describe('#ifError()', () => {
		it('is a function', () => {
			assert.ifError.should.be.a.Function();
		});

		it('does not throw null', () => {
			should.doesNotThrow(function () {
				assert.ifError(null);
			});
		});

		it('does not throw undefined', () => {
			should.doesNotThrow(function () {
				assert.ifError(undefined);
			});
		});

		it('throws for falsy number', () => {
			should.throws(function () {
				assert.ifError(0);
			},
			function (err) {
				return err instanceof assert.AssertionError && err.message === 'ifError got unwanted exception: 0';
			});
		});

		it('throws for string', () => {
			should.throws(function () {
				assert.ifError('error');
			},
			function (err) {
				return err instanceof assert.AssertionError && err.message === 'ifError got unwanted exception: error';
			});
		});

		it('throws for Error instance', () => {
			should.throws(function () {
				assert.ifError(new Error());
			},
			function (err) {
				return err instanceof assert.AssertionError && err.message === 'ifError got unwanted exception: Error';
			});
		});

		it('throws for Error instance with correct stack frames', () => {
			should.throws(function () {
				let err;
				(function errorFrame() { // eslint-disable-line wrap-iife
					err = new Error('test error');
				})();

				(function ifErrorFrame() {  // eslint-disable-line wrap-iife
					assert.ifError(err);
				})();
			},
			function (err) {
				// AssertionError [ERR_ASSERTION]: ifError got unwanted exception: test error
				//     at ifErrorFrame
				//     at errorFrame

				// FIXME: Test the stack frames are correct!
				return err instanceof assert.AssertionError && err.message === 'ifError got unwanted exception: Error: test error';
			});
		});
	});

	describe('.strict', () => {
		it('is a function', function () {
			assert.strict.should.be.a.Function(); // it's an alias for assert.ok
		});

		it('is available off of itself', function () {
			assert.strict.strict.should.be.ok();
		});

		describe('#ok', () => {
			it('is a function', () => assert.strict.ok.should.be.a.Function());
		});

		describe('#ifError', () => {
			it('is a function', () => assert.strict.ifError.should.be.a.Function());
		});

		describe('#fail', () => {
			it('is a function', () => assert.strict.fail.should.be.a.Function());
		});

		describe('#deepEqual', () => {
			it('is a function', () => assert.strict.deepEqual.should.be.a.Function());
		});

		describe('#throws', () => {
			it('is a function', () => assert.strict.throws.should.be.a.Function());
		});

		describe('#doesNotThrow', () => {
			it('is a function', () => assert.strict.doesNotThrow.should.be.a.Function());
		});

		describe('#rejects', () => {
			it('is a function', () => assert.strict.rejects.should.be.a.Function());
		});

		describe('#doesNotReject', () => {
			it('is a function', () => assert.strict.doesNotReject.should.be.a.Function());
		});

		describe('#strictEqual', () => {
			it('is a function', () => assert.strict.strictEqual.should.be.a.Function());
		});

		describe('#notStrictEqual', () => {
			it('is a function', () => assert.strict.notStrictEqual.should.be.a.Function());
		});

		describe('#deepStrictEqual', () => {
			it('is a function', () => assert.strict.deepStrictEqual.should.be.a.Function());
		});

		describe('#notDeepStrictEqual', () => {
			it('is a function', () => assert.strict.notDeepStrictEqual.should.be.a.Function());
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
