/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
/* eslint no-array-constructor: "off" */
/* eslint no-new-wrappers: "off" */

const should = require('./utilities/assertions');
const utilities = require('./utilities/utilities');

let util;

describe('util', () => {
	it('should be required as core module', () => {
		util = require('util');
		should(util).be.an.Object();
	});

	// For copious tests, see https://github.com/nodejs/node/blob/master/test/parallel/test-util-format.js
	describe('#format()', () => {
		it('is a function', () => {
			should(util.format).be.a.Function();
		});

		it('if placeholder has no corresponding argument, don\'t replace placeholder', () => {
			should(util.format('%s:%s', 'foo')).eql('foo:%s');
		});

		it('extra arguments are coerced into strings and concatenated delimited by space', () => {
			should(util.format('%s:%s', 'foo', 'bar', 'baz')).eql('foo:bar baz');
		});

		it('if first arg is not string, concat all args separated by spaces', () => {
			should(util.format(1, 2, 3)).eql('1 2 3');
		});

		it('if only one arg, returned as-is', () => {
			should(util.format('%% %s')).eql('%% %s');
		});

		describe('String placeholder', () => {
			it('with int', () => {
				should(util.format('%s', 1)).eql('1');
				should(util.format('%s', 42)).eql('42');
				should(util.format('%s %s', 42, 43)).eql('42 43');
				should(util.format('%s %s', 42)).eql('42 %s');
			});

			it('with undefined', () => {
				should(util.format('%s', undefined)).eql('undefined');
			});

			it('with null', () => {
				should(util.format('%s', null)).eql('null');
			});

			it('with string', () => {
				should(util.format('%s', 'foo')).eql('foo');
			});

			it('with string holding int value', () => {
				should(util.format('%s', '42')).eql('42');
			});

			it('with floats', () => {
				should(util.format('%s', 42.0)).eql('42');
				should(util.format('%s', 1.5)).eql('1.5');
				should(util.format('%s', -0.5)).eql('-0.5');
			});

			it('with Symbol', () => {
				should(util.format('%s', Symbol())).eql('Symbol()');
				should(util.format('%s', Symbol('foo'))).eql('Symbol(foo)');
			});
			// TODO: BigInt
		});

		describe('Number placeholder', () => {
			it('with floats', () => {
				should(util.format('%d', 42.0)).eql('42');
				should(util.format('%d', 1.5)).eql('1.5');
				should(util.format('%d', -0.5)).eql('-0.5');
			});

			it('with ints', () => {
				should(util.format('%d', 42)).eql('42');
				should(util.format('%d %d', 42, 43)).eql('42 43');
				should(util.format('%d %d', 42)).eql('42 %d');
			});

			it('with string holding int value', () => {
				should(util.format('%d', '42')).eql('42');
			});

			it('with string holding float value', () => {
				should(util.format('%d', '42.0')).eql('42');
			});

			it('with empty string', () => {
				should(util.format('%d', '')).eql('0');
			});

			it('with Symbol', () => {
				should(util.format('%d', Symbol())).eql('NaN');
			});

			it('with null', () => {
				should(util.format('%d', null)).eql('0');
			});

			it('with undefined', () => {
				should(util.format('%d', undefined)).eql('NaN');
			});

			// TODO: BigInt
		});

		describe('Float placeholder', () => {
			it('with floats', () => {
				should(util.format('%f', 42.0)).eql('42');
				should(util.format('%f', 1.5)).eql('1.5');
				should(util.format('%f', -0.5)).eql('-0.5');
			});

			it('with ints', () => {
				should(util.format('%f', 42)).eql('42');
				should(util.format('%f %f', 42, 43)).eql('42 43');
				should(util.format('%f %f', 42)).eql('42 %f');
			});

			it('with string holding int value', () => {
				should(util.format('%f', '42')).eql('42');
			});

			it('with string holding float value', () => {
				should(util.format('%f', '42.0')).eql('42');
			});

			it('with empty string', () => {
				should(util.format('%f', '')).eql('NaN');
			});

			it('with Symbol', () => {
				should(util.format('%f', Symbol())).eql('NaN');
			});

			it('with null', () => {
				should(util.format('%f', null)).eql('NaN');
			});

			it('with undefined', () => {
				should(util.format('%f', undefined)).eql('NaN');
			});

			// TODO: BigInt
		});

		describe('Integer placeholder', () => {
			it('with ints', () => {
				should(util.format('%i', 42)).eql('42');
				should(util.format('%i %i', 42, 43)).eql('42 43');
				should(util.format('%i %i', 42)).eql('42 %i');
			});

			it('with floats', () => {
				should(util.format('%i', 42.0)).eql('42');
				should(util.format('%i', 1.5)).eql('1');
				should(util.format('%i', -0.5)).eql('-0');
			});

			it('with string holding int value', () => {
				should(util.format('%i', '42')).eql('42');
			});

			it('with string holding float value', () => {
				should(util.format('%i', '42.0')).eql('42');
			});

			it('with empty string', () => {
				should(util.format('%i', '')).eql('NaN');
			});

			it('with Symbol', () => {
				should(util.format('%i', Symbol())).eql('NaN');
			});

			it('with null', () => {
				should(util.format('%i', null)).eql('NaN');
			});

			it('with undefined', () => {
				should(util.format('%i', undefined)).eql('NaN');
			});

			// TODO: BigInt
		});

		describe('JSON placeholder', () => {
			it('with floats', () => {
				should(util.format('%j', 42.0)).eql('42');
				should(util.format('%j', 1.5)).eql('1.5');
				should(util.format('%j', -0.5)).eql('-0.5');
			});

			it('with ints', () => {
				should(util.format('%j', 42)).eql('42');
				should(util.format('%j %j', 42, 43)).eql('42 43');
				should(util.format('%j %j', 42)).eql('42 %j');
			});

			it('with string holding int value', () => {
				should(util.format('%j', '42')).eql('"42"');
			});

			it('with string holding float value', () => {
				should(util.format('%j', '42.0')).eql('"42.0"');
			});

			it('with empty string', () => {
				should(util.format('%j', '')).eql('""');
			});

			it('with Symbol', () => {
				should(util.format('%j', Symbol())).eql('undefined');
			});

			it('with null', () => {
				should(util.format('%j', null)).eql('null');
			});

			it('with undefined', () => {
				should(util.format('%j', undefined)).eql('undefined');
			});

			it('with object having circular reference', () => {
				const o = {};
				o.o = o;
				should(util.format('%j', o)).eql('[Circular]');
			});

			it('with object throwing Error in toJSON() re-throws Error', () => {
				const o = {
					toJSON: () => {
						throw new Error('Failed!');
					}
				};
				should((() => util.format('%j', o))).throw('Failed!');
			});

			// TODO: BigInt
		});

		describe('%O - object placeholder', () => {
			it('with int', () => {
				should(util.format('%O', 42)).eql('42');
			});

			it('with undefined', () => {
				should(util.format('%O', undefined)).eql('undefined');
			});

			it('with null', () => {
				should(util.format('%O', null)).eql('null');
			});

			it('with string', () => {
				should(util.format('%O', 'foo')).eql('\'foo\'');
			});

			it('with string holding int value', () => {
				should(util.format('%O', '42')).eql('\'42\'');
			});

			it('with floats', () => {
				should(util.format('%O', 42.0)).eql('42');
				should(util.format('%O', 1.5)).eql('1.5');
				should(util.format('%O', -0.5)).eql('-0.5');
			});

			it('with Symbol', () => {
				should(util.format('%O', Symbol())).eql('Symbol()');
				should(util.format('%O', Symbol('foo'))).eql('Symbol(foo)');
			});

			it('with simple object', () => {
				const obj = {
					foo: 'bar'
				};
				should(util.format('%O', obj)).eql('{ foo: \'bar\' }');
			});

			it('with object', () => {
				const obj = {
					foo: 'bar',
					foobar: 1,
					func: function () {}
				};
				should(util.format('%O', obj)).eql('{ foo: \'bar\', foobar: 1, func: [Function: func] }');
			});

			it('with nested object', () => {
				const nestedObj2 = {
					foo: 'bar',
					foobar: 1,
					func: [ { a: function () {} } ]
				};
				// FIXME: There's a weird edge case we fail here: when function is at cutoff depth and showHidden is true, we report '[Function: a]', while node reports '[Function]'
				// I don't know why.
				should(util.format('%O', nestedObj2)).eql(
					'{ foo: \'bar\', foobar: 1, func: [ { a: [Function: a] } ] }');
			});

			it('with same object twice', () => {
				const obj = {
					foo: 'bar',
					foobar: 1,
					func: function () {}
				};
				should(util.format('%O %O', obj, obj)).eql(
					'{ foo: \'bar\', foobar: 1, func: [Function: func] } '
					+ '{ foo: \'bar\', foobar: 1, func: [Function: func] }');
			});
		});

		describe('%o - object placeholder', () => {
			it('with int', () => {
				should(util.format('%o', 42)).eql('42');
			});

			it('with undefined', () => {
				should(util.format('%o', undefined)).eql('undefined');
			});

			it('with null', () => {
				should(util.format('%o', null)).eql('null');
			});

			it('with string', () => {
				should(util.format('%o', 'foo')).eql('\'foo\'');
			});

			it('with string holding int value', () => {
				should(util.format('%o', '42')).eql('\'42\'');
			});

			it('with floats', () => {
				should(util.format('%o', 42.0)).eql('42');
				should(util.format('%o', 1.5)).eql('1.5');
				should(util.format('%o', -0.5)).eql('-0.5');
			});

			it('with Symbol', () => {
				should(util.format('%o', Symbol())).eql('Symbol()');
				should(util.format('%o', Symbol('foo'))).eql('Symbol(foo)');
			});

			it('with simple object', () => {
				const obj = {
					foo: 'bar'
				};
				should(util.format('%o', obj)).eql('{ foo: \'bar\' }');
			});

			// FIXME: JSC/iOS seems to have inconsistent ordering of properties
			// First time around, it tends to go: arguments, caller, length, name, prototype.
			// Android/V8 is consistent
			// The property order is not consistent on iOS, which is kind of expected
			// since internally Object.getOwnPropertyNames is used, which does not
			// guarantee a specific order of returned property names.
			// On Android the order seems to be consistent
			it('with object', () => {
				const obj = {
					foo: 'bar',
					foobar: 1,
					func: function () {}
				};
				const result = util.format('%o', obj);
				if (utilities.isAndroid()) { // Android/V8
					should(result).eql(
						'{\n'
						+ '  foo: \'bar\',\n'
						+ '  foobar: 1,\n'
						+ '  func: <ref *1> [Function: func] {\n'
						+ '    [length]: 0,\n'
						+ '    [name]: \'func\',\n'
						+ '    [arguments]: null,\n'
						+ '    [caller]: null,\n'
						+ '    [prototype]: func { [constructor]: [Circular *1] }\n'
						+ '  }\n'
						+ '}'
					);
				} else { // iOS/JSC
					should(result).eql(
						'{\n'
						+ '  foo: \'bar\',\n'
						+ '  foobar: 1,\n'
						+ '  func: <ref *1> [Function: func] {\n'
						+ '    [arguments]: null,\n'
						+ '    [caller]: null,\n'
						+ '    [length]: 0,\n'
						+ '    [name]: \'func\',\n'
						+ '    [prototype]: func { [constructor]: [Circular *1] }\n'
						+ '  }\n'
						+ '}'
					);
				}
			});

			it('with nested object', () => {
				const nestedObj2 = {
					foo: 'bar',
					foobar: 1,
					func: [ { a: function () {} } ]
				};
				const result = util.format('%o', nestedObj2);
				if (utilities.isAndroid()) { // Android/V8
					should(result).eql(
						'{\n'
						+ '  foo: \'bar\',\n'
						+ '  foobar: 1,\n'
						+ '  func: [\n'
						+ '    {\n'
						+ '      a: <ref *1> [Function: a] {\n'
						+ '        [length]: 0,\n'
						+ '        [name]: \'a\',\n'
						+ '        [arguments]: null,\n'
						+ '        [caller]: null,\n'
						+ '        [prototype]: a { [constructor]: [Circular *1] }\n'
						+ '      }\n'
						+ '    },\n'
						+ '    [length]: 1\n'
						+ '  ]\n'
						+ '}'
					);
				} else { // iOS/JSC
					should(result).eql(
						'{\n'
						+ '  foo: \'bar\',\n'
						+ '  foobar: 1,\n'
						+ '  func: [\n'
						+ '    {\n'
						+ '      a: <ref *1> [Function: a] {\n'
						+ '        [arguments]: null,\n'
						+ '        [caller]: null,\n'
						+ '        [length]: 0,\n'
						+ '        [name]: \'a\',\n'
						+ '        [prototype]: a { [constructor]: [Circular *1] }\n'
						+ '      }\n'
						+ '    },\n'
						+ '    [length]: 1\n'
						+ '  ]\n'
						+ '}'
					);
				}
			});

			it('with same object twice', () => {
				const obj = {
					foo: 'bar',
					foobar: 1,
					func: function () {}
				};
				const result = util.format('%o %o', obj, obj);
				if (utilities.isAndroid()) { // Android/V8
					should(result).eql(
						'{\n'
						+ '  foo: \'bar\',\n'
						+ '  foobar: 1,\n'
						+ '  func: <ref *1> [Function: func] {\n'
						+ '    [length]: 0,\n'
						+ '    [name]: \'func\',\n'
						+ '    [arguments]: null,\n'
						+ '    [caller]: null,\n'
						+ '    [prototype]: func { [constructor]: [Circular *1] }\n'
						+ '  }\n'
						+ '} {\n'
						+ '  foo: \'bar\',\n'
						+ '  foobar: 1,\n'
						+ '  func: <ref *1> [Function: func] {\n'
						+ '    [length]: 0,\n'
						+ '    [name]: \'func\',\n'
						+ '    [arguments]: null,\n'
						+ '    [caller]: null,\n'
						+ '    [prototype]: func { [constructor]: [Circular *1] }\n'
						+ '  }\n'
						+ '}'
					);
				} else { // iOS/JSC
					should(result).eql(
						'{\n'
						+ '  foo: \'bar\',\n'
						+ '  foobar: 1,\n'
						+ '  func: <ref *1> [Function: func] {\n'
						+ '    [arguments]: null,\n'
						+ '    [caller]: null,\n'
						+ '    [length]: 0,\n'
						+ '    [name]: \'func\',\n'
						+ '    [prototype]: func { [constructor]: [Circular *1] }\n'
						+ '  }\n'
						+ '} {\n'
						+ '  foo: \'bar\',\n'
						+ '  foobar: 1,\n'
						+ '  func: <ref *1> [Function: func] {\n'
						+ '    [arguments]: null,\n'
						+ '    [caller]: null,\n'
						+ '    [prototype]: func { [constructor]: [Circular *1] },\n'
						+ '    [name]: \'func\',\n'
						+ '    [length]: 0\n'
						+ '  }\n'
						+ '}'
					);
				}
			});
		});
	});

	describe('#inspect()', () => {
		it('is a function', () => {
			should(util.inspect).be.a.Function();
		});

		it('handles string literal', () => {
			should(util.inspect('a')).eql('\'a\'');
		});

		it('handles number literal', () => {
			should(util.inspect(1)).eql('1');
		});

		it('handles empty array', () => {
			should(util.inspect([])).eql('[]');
		});

		it('handles array with number values', () => {
			should(util.inspect([ 1, 2, 3 ])).eql('[ 1, 2, 3 ]');
		});

		it('handles array with mixed values', () => {
			should(util.inspect([ 'a', 2 ])).eql('[ \'a\', 2 ]');
		});

		it('handles sparse array', () => {
			// eslint-disable-next-line no-sparse-arrays
			should(util.inspect([ 1, , 3 ])).eql('[ 1, <1 empty item>, 3 ]');
		});

		it('handles sparse array with multiple items missing in a row', () => {
			// eslint-disable-next-line no-sparse-arrays
			should(util.inspect([ 1,,,, 3 ])).eql('[ 1, <3 empty items>, 3 ]');
		});

		it('handles sparse array with multiple separate gaps', () => {
			// eslint-disable-next-line no-sparse-arrays
			should(util.inspect([ 1,,,, 3, ,, 4 ])).eql('[ 1, <3 empty items>, 3, <2 empty items>, 4 ]');
		});

		it('handles array with length > options.maxArrayLength', () => {
			should(util.inspect([ 1, 2, 3 ], { maxArrayLength: 1 })).eql('[ 1, ... 2 more items ]');
		});

		it('handles array with length > options.maxArrayLength and is sparse', () => {
			// eslint-disable-next-line no-sparse-arrays
			should(util.inspect([ 1,,,, 3, ,, 4 ], { maxArrayLength: 1 })).eql('[ 1, ... 7 more items ]');
		});

		it('handles sparse array with length > options.maxArrayLength counting gaps as one item for length', () => {
			// eslint-disable-next-line no-sparse-arrays
			should(util.inspect([ 1,,,, ], { maxArrayLength: 2 })).eql('[ 1, <3 empty items> ]');
			// eslint-disable-next-line no-sparse-arrays
			should(util.inspect([ 1,,,, 3, ,, 4 ], { maxArrayLength: 2 })).eql('[ 1, <3 empty items>, ... 4 more items ]');
			// eslint-disable-next-line no-sparse-arrays
			should(util.inspect([ 1,,,, 3, ,, 4 ], { maxArrayLength: 3 })).eql('[ 1, <3 empty items>, 3, ... 3 more items ]');
			// eslint-disable-next-line no-sparse-arrays
			should(util.inspect([ 1,,,, 3, ,, 4 ], { maxArrayLength: 4 })).eql('[ 1, <3 empty items>, 3, <2 empty items>, ... 1 more item ]');
		});

		it('handles Regexp literal', () => {
			should(util.inspect(/123/)).eql('/123/');
		});

		it('handles Regexp literal with flags', () => {
			should(util.inspect(/123/ig)).eql('/123/gi');
		});

		it('handles new Regexp instance', () => {
			should(util.inspect(new RegExp())).eql('/(?:)/');
		});

		it('handles object primitive literal', () => {
			should(util.inspect({})).eql('{}');
		});

		it('handles new Object', () => {
			// eslint-disable-next-line no-new-object
			should(util.inspect(new Object())).eql('{}');
		});

		it('handles Map instance', () => {
			should(util.inspect(new Map())).eql('Map {}');
		});

		it('handles Map instance with key/value pair', () => {
			should(util.inspect(new Map([ [ 'a', 1 ] ]))).eql('Map { \'a\' => 1 }');
		});

		it('handles empty Set instance', () => {
			should(util.inspect(new Set())).eql('Set {}');
		});

		it('handles Set instance with number values', () => {
			should(util.inspect(new Set([ 1, 2, 3 ]))).eql('Set { 1, 2, 3 }');
		});

		it('handles object with custom type tag', () => {
			const baz = Object.create({}, { [Symbol.toStringTag]: { value: 'foo' } });
			should(util.inspect(baz)).eql('Object [foo] {}');
		});

		it('handles object with null prototype', () => {
			const baz = Object.create(null, {});
			should(util.inspect(baz)).eql('[Object: null prototype] {}');
		});

		it('handles class instance', () => {
			class Bar {}
			should(util.inspect(new Bar())).eql('Bar {}');
		});

		it('handles class instance with custom type tag', () => {
			class Foo {
				get [Symbol.toStringTag]() {
					return 'bar';
				}
			}
			should(util.inspect(new Foo())).eql('Foo [bar] {}');
		});

		it('handles empty function', () => {
			should(util.inspect(function () {})).eql('[Function (anonymous)]');
		});

		it('handles named function', () => {
			should(util.inspect(function bar() {})).eql('[Function: bar]');
		});

		it('handles arrow function', () => {
			should(util.inspect(() => {})).eql('[Function (anonymous)]');
		});

		it('handles function with custom property', () => {
			const myFunc = () => {};
			myFunc.a = 1;
			should(util.inspect(myFunc)).eql('[Function: myFunc] { a: 1 }');
		});

		it('handles object with getter property', () => {
			const obj = {};
			// eslint-disable-next-line accessor-pairs
			Object.defineProperty(obj, 'whatever', { get: () => 1, enumerable: true });
			should(util.inspect(obj)).eql('{ whatever: [Getter] }');
		});

		it('handles object with setter property', () => {
			const obj = {};
			// eslint-disable-next-line accessor-pairs
			Object.defineProperty(obj, 'whatever2', { set: () => {}, enumerable: true });
			should(util.inspect(obj)).eql('{ whatever2: [Setter] }');
		});

		it('handles object with getter/setter property', () => {
			const obj = {};
			Object.defineProperty(obj, 'whatever3', { get: () => 1, set: () => {}, enumerable: true });
			should(util.inspect(obj)).eql('{ whatever3: [Getter/Setter] }');
		});

		it('handles object with property holding explicit undefined value', () => {
			const obj = {};
			Object.defineProperty(obj, 'whatever4', { value: undefined, enumerable: true });
			should(util.inspect(obj)).eql('{ whatever4: undefined }');
		});

		it('with simple object', () => {
			const obj = {
				foo: 'bar'
			};
			should(util.inspect(obj)).eql('{ foo: \'bar\' }');
		});

		it('with same object repeated in an array', () => {
			const a = { id: 1 };
			should(util.inspect([ a, a ])).eql('[ { id: 1 }, { id: 1 } ]');
		});

		it('with object', () => {
			const obj = {
				foo: 'bar',
				foobar: 1,
				func: function () {}
			};
			// In Node 10+, we can sort the properties to ensure order to match, otherwise JSC/V8 return arguments/caller in different order on Functions
			should(util.inspect(obj, {
				showHidden: true,
				breakLength: Infinity,
				sorted: true
			})).eql(
				'{ foo: \'bar\', foobar: 1, func: <ref *1> [Function: func] { [arguments]: null, [caller]: null, [length]: 0, [name]: \'func\', [prototype]: func { [constructor]: [Circular *1] } } }'
			);
		});

		it('with nested object and infinite depth', () => {
			const nestedObj2 = {
				foo: 'bar',
				foobar: 1,
				func: [ { a: function () {} } ]
			};

			// In Node 10+, we can sort the properties to ensure order to match, otheerwise JSC/V8 return arguments/caller in different order on Functions
			should(util.inspect(nestedObj2, {
				showHidden: true,
				breakLength: Infinity,
				depth: Infinity,
				sorted: true
			})).eql(
				'{\n'
				+ '  foo: \'bar\',\n'
				+ '  foobar: 1,\n'
				+ '  func: [\n'
				+ '    { a: <ref *1> [Function: a] { [arguments]: null, [caller]: null, [length]: 0, [name]: \'a\', [prototype]: a { [constructor]: [Circular *1] } } },\n'
				+ '    [length]: 1\n'
				+ '  ]\n'
				+ '}'
			);
		});

		it('with nested object and default depth', () => {
			const nestedObj2 = {
				foo: 'bar',
				foobar: 1,
				func: [ { a: function () {} } ]
			};
			should(util.inspect(nestedObj2, { showHidden: true, breakLength: Infinity })).eql(
				'{ foo: \'bar\', foobar: 1, func: [ { a: [Function] }, [length]: 1 ] }');
		});

		it('with toplevel object that breaks and nested object that doesn\'t break', () => {
			const nestedObj2 = {
				foo: 'bar',
				foobar: 1,
				func: {
					other: true,
					yeah: 'man'
				},
				something: 'else'
			};
			should(util.inspect(nestedObj2)).eql(
				'{\n'
				+ '  foo: \'bar\',\n'
				+ '  foobar: 1,\n'
				+ '  func: { other: true, yeah: \'man\' },\n'
				+ '  something: \'else\'\n'
				+ '}');
		});

		it('with toplevel and nested objects that break', () => {
			const nestedObj2 = {
				foo: 'bar',
				foobar: 1,
				func: {
					other: true,
					yeah: 'man',
					whatever: '123456789',
					whatever2: '123456789'
				}
			};
			should(util.inspect(nestedObj2)).eql(
				'{\n'
				+ '  foo: \'bar\',\n'
				+ '  foobar: 1,\n'
				+ '  func: {\n'
				+ '    other: true,\n'
				+ '    yeah: \'man\',\n'
				+ '    whatever: \'123456789\',\n'
				+ '    whatever2: \'123456789\'\n'
				+ '  }\n'
				+ '}'
			);
		});

		it('with nested object and empty options', () => {
			const nestedObj2 = {
				foo: 'bar',
				foobar: 1,
				func: [ { a: function () {} } ]
			};
			should(util.inspect(nestedObj2, {})).eql(
				'{ foo: \'bar\', foobar: 1, func: [ { a: [Function: a] } ] }');
		});

		it('with default breakLength at exact break point', () => {
			const obj = {
				foo: '',
				foobar: 1,
				something: '1',
				whatever: '',
				whatever2: '',
				whatever3: ''
			};
			should(util.inspect(obj)).eql('{\n  foo: \'\',\n  foobar: 1,\n  something: \'1\',\n  whatever: \'\',\n  whatever2: \'\',\n  whatever3: \'\'\n}');
		});

		it('with default breakLength just below break point', () => {
			const obj = {
				foo: '',
				foobar: 1,
				something: '1',
				whatever: '',
				whatever2: ''
			};
			should(util.inspect(obj)).eql('{ foo: \'\', foobar: 1, something: \'1\', whatever: \'\', whatever2: \'\' }');
		});
	});

	describe('#inherits()', () => {
		it('is a function', () => {
			should(util.inherits).be.a.Function();
		});

		it('hooks subclass to super constructor', (finished) => {
			function BaseClass() {
				this.listeners = {};
			}

			BaseClass.prototype.on = function (eventName, listener) {
				const eventListeners = this.listeners[eventName] || [];
				eventListeners.push(listener);
				this.listeners[eventName] = eventListeners;
			};

			BaseClass.prototype.emit = function (eventName, data) {
				const eventListeners = this.listeners[eventName] || [];
				for (const listener of eventListeners) {
					listener.call(this, data);
				}
			};

			function MyStream() {
				BaseClass.call(this);
			}

			util.inherits(MyStream, BaseClass);

			MyStream.prototype.write = function (data) {
				this.emit('data', data);
			};

			const stream = new MyStream();

			should(stream instanceof BaseClass).be.true();
			should(MyStream.super_).eql(BaseClass);

			stream.on('data', data => {
				should(data).eql('It works!');
				finished();
			});
			stream.write('It works!'); // Received data: "It works!"
		});

		it('throws TypeError if super constructor is null', () => {
			function BaseClass() {
			}

			function MyStream() {
				BaseClass.call(this);
			}

			should.throws(() => util.inherits(MyStream, null),
				TypeError
			);
		});

		it('throws TypeError if constructor is null', () => {
			function BaseClass() {
			}

			should.throws(() => util.inherits(null, BaseClass),
				TypeError
			);
		});

		it('throws TypeError if super constructor has no prototype', () => {
			const BaseClass = Object.create(null, {});

			function MyStream() {
				BaseClass.call(this);
			}

			should.throws(() => util.inherits(MyStream, BaseClass),
				TypeError
			);
		});
	});

	describe('#isArray', () => {
		it('should return true only if the given object is an Array', () => {
			should.strictEqual(util.isArray([]), true);
			should.strictEqual(util.isArray(Array()), true);
			should.strictEqual(util.isArray(new Array()), true);
			should.strictEqual(util.isArray(new Array(5)), true);
			should.strictEqual(util.isArray(new Array('with', 'some', 'entries')), true);
			should.strictEqual(util.isArray({}), false);
			should.strictEqual(util.isArray({ push: function () {} }), false);
			should.strictEqual(util.isArray(/regexp/), false);
			should.strictEqual(util.isArray(new Error()), false);
			should.strictEqual(util.isArray(Object.create(Array.prototype)), false);
		});
	});

	describe('#isRegExp', () => {
		it('should return true only if the given object is a RegExp', () => {
			should.strictEqual(util.isRegExp(/regexp/), true);
			should.strictEqual(util.isRegExp(RegExp(), 'foo'), true);
			should.strictEqual(util.isRegExp(new RegExp()), true);
			should.strictEqual(util.isRegExp({}), false);
			should.strictEqual(util.isRegExp([]), false);
			should.strictEqual(util.isRegExp(new Date()), false);
			should.strictEqual(util.isRegExp(Object.create(RegExp.prototype)), false);
		});
	});

	describe('#isDate', () => {
		it('should return true only if the given object is a Date', () => {
			should.strictEqual(util.isDate(new Date()), true);
			should.strictEqual(util.isDate(new Date(0), 'foo'), true);
			should.strictEqual(util.isDate(Date()), false);
			should.strictEqual(util.isDate({}), false);
			should.strictEqual(util.isDate([]), false);
			should.strictEqual(util.isDate(new Error()), false);
			should.strictEqual(util.isDate(Object.create(Date.prototype)), false);
		});
	});

	describe('#isError', () => {
		it('should return true only if the given object is an Error', () => {
			should.strictEqual(util.isError(new Error()), true);
			should.strictEqual(util.isError(new TypeError()), true);
			should.strictEqual(util.isError(new SyntaxError()), true);
			should.strictEqual(util.isError({}), false);
			should.strictEqual(util.isError({ name: 'Error', message: '' }), false);
			should.strictEqual(util.isError([]), false);
			should.strictEqual(util.isError(Object.create(Error.prototype)), true);
		});
	});

	describe('#isObject', () => {
		it('should return true only if the given object is an Object', () => {
			should.strictEqual(util.isObject({}), true);
			should.strictEqual(util.isObject([]), true);
			should.strictEqual(util.isObject(new Number(3)), true);
			should.strictEqual(util.isObject(Number(4)), false);
			should.strictEqual(util.isObject(1), false);
		});
	});

	describe('#isPrimitive', () => {
		it('should return true only if the given object is a primitve', () => {
			should.strictEqual(util.isPrimitive({}), false);
			should.strictEqual(util.isPrimitive(new Error()), false);
			should.strictEqual(util.isPrimitive(new Date()), false);
			should.strictEqual(util.isPrimitive([]), false);
			should.strictEqual(util.isPrimitive(/regexp/), false);
			should.strictEqual(util.isPrimitive(function () {}), false);
			should.strictEqual(util.isPrimitive(new Number(1)), false);
			should.strictEqual(util.isPrimitive(new String('bla')), false);
			should.strictEqual(util.isPrimitive(new Boolean(true)), false);
			should.strictEqual(util.isPrimitive(1), true);
			should.strictEqual(util.isPrimitive('bla'), true);
			should.strictEqual(util.isPrimitive(true), true);
			should.strictEqual(util.isPrimitive(undefined), true);
			should.strictEqual(util.isPrimitive(null), true);
			should.strictEqual(util.isPrimitive(Infinity), true);
			should.strictEqual(util.isPrimitive(NaN), true);
			should.strictEqual(util.isPrimitive(Symbol('symbol')), true);
		});
	});

	describe('#isBuffer', () => {
		it('should return true only if the given object is a Buffer', () => {
			should.strictEqual(util.isBuffer('foo'), false);
			should.strictEqual(util.isBuffer(Buffer.from('foo')), true);
		});
	});

	describe('#promisify()', () => {
		it('is a function', () => {
			should(util.promisify).be.a.Function();
		});

		it('wraps callback function to return promise with resolve', (finished) => {
			function callbackOriginal(argOne, argTwo, next) {
				next(argOne, argTwo);
			}
			const promisified = util.promisify(callbackOriginal);
			const result = promisified(null, 123);
			should(result instanceof Promise).be.true();
			result.then(value => { // eslint-disable-line promise/always-return
				should(value).eql(123);
				finished();
			}).catch(err => finished(err));
		});

		it('wraps callback function to return promise with rejection', (finished) => {
			function callbackOriginal(argOne, argTwo, next) {
				next(argOne, argTwo);
			}
			const promisified = util.promisify(callbackOriginal);
			const result = promisified(new Error('example'), 123);
			should(result instanceof Promise).be.true();
			result.then(value => { // eslint-disable-line promise/always-return
				should(value).eql(123);
				finished(new Error('Expected promise to get rejected!'));
			}).catch(err => {
				should(err.message).eql('example');
				finished();
			});
		});

		it('throws TypeError if original argument is not a function', () => {
			should.throws(() => util.promisify({}),
				TypeError
			);
		});
	});

	describe('#callbackify()', () => {
		it('is a function', () => {
			should(util.callbackify).be.a.Function();
		});

		it('wraps function returning Promise to return function accepting callback (with success)', (finished) => {
			function original(argOne) {
				return Promise.resolve(argOne);
			}
			const callbackified = util.callbackify(original);
			callbackified(23, (err, result) => {
				try {
					should(err).not.be.ok();
					should(result).eql(23);
					finished();
				} catch (e) {
					finished(e);
				}
			});
		});

		it('wraps function returning Promise to return function accepting callback (with error)', (finished) => {
			function original(argOne) {
				return Promise.reject(argOne);
			}
			const callbackified = util.callbackify(original);
			callbackified(new Error('expected this'), (err, result) => {
				try {
					should(err).be.ok();
					should(result).not.be.ok();
					finished();
				} catch (e) {
					finished(e);
				}
			});
		});

		it('handles special case of falsy rejection', (finished) => {
			function original() {
				return Promise.reject(null);
			}
			const callbackified = util.callbackify(original);
			callbackified((err, _result) => {
				try {
					should(err).be.ok();
					should(err instanceof Error).be.true();
					should(err.reason).eql(null);
					finished();
				} catch (e) {
					finished(e);
				}
			});
		});

		it('throws TypeError if original argument is not a function', () => {
			should.throws(() => util.callbackify({}),
				TypeError
			);
		});
	});

	describe('#deprecate()', () => {
		it('is a function', () => {
			should(util.deprecate).be.a.Function();
		});

		it('wraps function to emit warning', () => {
			function original(...args) {
				return args;
			}
			const deprecated = util.deprecate(original, 'dont call me Al');
			// this should get called synchronously, so I don't think we need to do any setTimeout/async finished stuff
			process.once('warning', warning => {
				should(warning.name).eql('DeprecationWarning');
				should(warning.message).eql('dont call me Al');
			});
			const result = deprecated(null, 123);
			should(result).eql([ null, 123 ]);
		});

		// TODO: Test that we return original function if process.noDeprecation is true!
	});

	describe('#log()', () => {
		it('is a function', () => {
			should(util.log).be.a.Function();
		});

		it('prepends timestamp to message', () => {
			// Hijack console.log! NOTE: This doesn't work on iOS until we move to obj-c API!
			const original = console.log;
			try {
				console.log = string => {
					should(string).match(/^\d{1,2} \w{3} \d{2}:\d{2}:\d{2} - message$/);
				};
				util.log('message');
			} finally {
				console.log = original;
			}
		});
	});

	describe('#print()', () => {
		it('is a function', () => {
			should(util.print).be.a.Function();
		});

		it('concatenates with no join', () => {
			// Hijack console.log! NOTE: This doesn't work on iOS until we move to obj-c API!
			const original = console.log;
			try {
				console.log = string => {
					should(string).eql('123');
				};
				util.print(1, 2, 3);
			} finally {
				console.log = original;
			}
		});
	});

	describe('#puts()', () => {
		it('is a function', () => {
			should(util.puts).be.a.Function();
		});

		it('concatenates with newline join', () => {
			// Hijack console.log! NOTE: This doesn't work on iOS until we move to obj-c API!
			const original = console.log;
			try {
				console.log = string => {
					should(string).eql('1\n2\n3');
				};
				util.puts(1, 2, 3);
			} finally {
				console.log = original;
			}
		});
	});

	describe('#debug()', () => {
		it('is a function', () => {
			should(util.debug).be.a.Function();
		});

		it('concatenates with newline join', () => {
			// Hijack console.error! NOTE: This doesn't work on iOS until we move to obj-c API!
			const original = console.error;
			try {
				console.error = string => {
					should(string).eql('DEBUG: message');
				};
				util.debug('message');
			} finally {
				console.error = original;
			}
		});
	});

	describe('#error()', () => {
		it('is a function', () => {
			should(util.error).be.a.Function();
		});

		it('concatenates with newline join', () => {
			// Hijack console.error! NOTE: This doesn't work on iOS until we move to obj-c API!
			const original = console.error;
			try {
				console.error = string => {
					should(string).eql('1\n2\n3');
				};
				util.error(1, 2, 3);
			} finally {
				console.error = original;
			}
		});
	});

	describe('.types', () => {
		describe('#isAnyArrayBuffer()', () => {
			it('should return true for built-in ArrayBuffer', () => {
				const ab = new ArrayBuffer();
				should(util.types.isAnyArrayBuffer(ab)).be.true();
			});

			it('should return true for built-in SharedArrayBuffer', () => {
				// SharedArrayBuffer is disabled in all major JS engines due to Spectre & Meltrdown vulnerabilities
			});

			it('should return false for other values', () => {
				should(util.types.isAnyArrayBuffer({})).be.false();
				should(util.types.isAnyArrayBuffer(new Float32Array())).be.false();
			});
		});

		describe('#isArgumentsObject()', () => {
			it('should return true for function arguments object', () => {
				(function () {
					should(util.types.isArgumentsObject(arguments)).be.true();
				}());
			});

			it('should return false for Array', () => {
				should(util.types.isArgumentsObject([])).be.false();
			});

			it.allBroken('should return false for object with Symbol.toStringTag of "Arguments"', () => {
				should(util.types.isArgumentsObject({ [Symbol.toStringTag]: 'Arguments' })).be.false();
			});
		});

		describe('#isArrayBuffer()', () => {
			it('should return true for built-in ArrayBuffer instance', () => {
				const ab = new ArrayBuffer();
				should(util.types.isArrayBuffer(ab)).be.true();
			});

			it('should return false for other values', () => {
				should(util.types.isArrayBuffer([])).be.false();
				should(util.types.isArrayBuffer(new Float32Array())).be.false();
			});
		});

		describe('#isAsyncFunction()', () => {
			it('should return true for async functions', () => {
				console.log(Object.prototype.toString.call(async () => {}));
				should(util.types.isAsyncFunction(async () => {})).be.true();
			});

			it('should return false for normal functions', () => {
				should(util.types.isAsyncFunction(() => {})).be.false();
			});
		});

		describe('#isNativeError()', () => {
			it('is a function', () => {
				should(util.types.isNativeError).be.a.Function();
			});

			it('returns true for Error instance', () => {
				should(util.types.isNativeError(new Error())).be.true();
			});

			it('returns true for EvalError instance', () => {
				should(util.types.isNativeError(new EvalError())).be.true();
			});

			it('returns true for RangeError instance', () => {
				should(util.types.isNativeError(new RangeError())).be.true();
			});

			it('returns true for ReferenceError instance', () => {
				should(util.types.isNativeError(new ReferenceError())).be.true();
			});

			it('returns true for SyntaxError instance', () => {
				should(util.types.isNativeError(new SyntaxError())).be.true();
			});

			it('returns true for TypeError instance', () => {
				should(util.types.isNativeError(new TypeError())).be.true();
			});

			it('returns true for URIError instance', () => {
				should(util.types.isNativeError(new URIError())).be.true();
			});

			it('returns false for custom Error subclass', () => {
				class SubError extends Error {}
				should(util.types.isNativeError(new SubError())).be.false();
			});
		});

		describe('#isNumberObject()', () => {
			it('is a function', () => {
				should(util.types.isNumberObject).be.a.Function();
			});

			it('returns true for boxed Number', () => {
				// eslint-disable-next-line no-new-wrappers
				should(util.types.isNumberObject(new Number())).be.true();
			});

			it('returns false for primitive Number', () => {
				should(util.types.isNumberObject(0)).be.false();
			});
		});

		describe('#isStringObject()', () => {
			it('is a function', () => {
				should(util.types.isStringObject).be.a.Function();
			});

			it('returns true for boxed String', () => {
				// eslint-disable-next-line no-new-wrappers
				should(util.types.isStringObject(new String('foo'))).be.true();
			});

			it('returns false for primitive String', () => {
				should(util.types.isStringObject('foo')).be.false();
			});
		});

		describe('#isBooleanObject()', () => {
			it('is a function', () => {
				should(util.types.isBooleanObject).be.a.Function();
			});

			it('returns true for boxed Boolean', () => {
				// eslint-disable-next-line no-new-wrappers
				should(util.types.isBooleanObject(new Boolean(false))).be.true();
			});

			it('returns false for primitive Boolean', () => {
				should(util.types.isBooleanObject(true)).be.false();
			});
		});

		// TODO: Re-enable when we have BigInt support
		// describe('#isBigIntObject()', () => {
		// 	it('is a function', () => {
		// 		should(util.types.isBigIntObject).be.a.Function();
		// 	});

		// 	it('returns true for boxed BigInt', () => {
		// 		// eslint-disable-next-line no-new-wrappers,no-undef
		// 		should(util.types.isSymbolObject(Object(BigInt(9007199254740991)))).be.true();
		// 	});

		// 	it('returns false for BigInt instance', () => {
		// 		// eslint-disable-next-line no-undef
		// 		should(util.types.isSymbolObject(BigInt(9007199254740991))).be.false();
		// 	});

		// it('returns false for primitive BigInt', () => {
		// 	should(util.types.isSymbolObject(9007199254740991n)).be.false();
		// });
		// });

		describe('#isSymbolObject()', () => {
			it('is a function', () => {
				should(util.types.isSymbolObject).be.a.Function();
			});

			it('returns true for boxed Symbol', () => {
				// eslint-disable-next-line no-new-wrappers
				should(util.types.isSymbolObject(Object(Symbol('foo')))).be.true();
			});

			it('returns false for primitive Symbol', () => {
				should(util.types.isSymbolObject(Symbol('foo'))).be.false();
			});
		});

		describe('#isBoxedPrimitive()', () => {
			it('is a function', () => {
				should(util.types.isBoxedPrimitive).be.a.Function();
			});

			it('returns false for primitive Boolean', () => {
				should(util.types.isBoxedPrimitive(false)).be.false();
			});

			it('returns true for boxed Boolean', () => {
				// eslint-disable-next-line no-new-wrappers
				should(util.types.isBoxedPrimitive(new Boolean(false))).be.true();
			});

			it('returns false for primitive Symbol', () => {
				should(util.types.isBoxedPrimitive(Symbol('foo'))).be.false();
			});

			it('returns true for boxed Symbol', () => {
				should(util.types.isBoxedPrimitive(Object(Symbol('foo')))).be.true();
			});

			// it('returns true for boxed BigInt', () => {
			// 	// eslint-disable-next-line no-undef
			// 	should(util.types.isBoxedPrimitive(Object(BigInt(5)))).be.true();
			// });
		});

		describe('#isSet()', () => {
			it('is a function', () => {
				should(util.types.isSet).be.a.Function();
			});

			it('returns true for Set instance', () => {
				should(util.types.isSet(new Set())).be.true();
			});
		});

		describe('#isSetIterator()', () => {
			it('should return true if the value is an iterator returned for a built-in Set instance', () => {
				const set = new Set();
				should(util.types.isSetIterator(set.keys())).be.true();
				should(util.types.isSetIterator(set.values())).be.true();
				should(util.types.isSetIterator(set.entries())).be.true();
				should(util.types.isSetIterator(set[Symbol.iterator]())).be.true();
			});

			it('should return false for other iterators', () => {
				const map = new Map();
				should(util.types.isSetIterator(map.values())).be.false();
			});
		});

		describe('#isMap()', () => {
			it('is a function', () => {
				should(util.types.isMap).be.a.Function();
			});

			it('returns true for Map instance', () => {
				should(util.types.isMap(new Map())).be.true();
			});
		});

		describe('#isMapIterator()', () => {
			it('should return true if the value is an iterator retunred for a built-in Map instance', () => {
				const map = new Map();
				should(util.types.isMapIterator(map.keys())).be.true();
				should(util.types.isMapIterator(map.values())).be.true();
				should(util.types.isMapIterator(map.entries())).be.true();
				should(util.types.isMapIterator(map[Symbol.iterator]())).be.true();
			});

			it('should return false for other iterators', () => {
				const set = new Set();
				should(util.types.isMapIterator(set.values())).be.false();
			});
		});

		describe('#isDataView()', () => {
			const ab = new ArrayBuffer(20);

			it('should return true for built-in DataView instance', () => {
				should(util.types.isDataView(new DataView(ab))).be.true();
			});

			it('should return false for typed array instance', () => {
				should(util.types.isDataView(new Float64Array())).be.false();
			});
		});

		describe('#isDate()', () => {
			it('is a function', () => {
				should(util.types.isDate).be.a.Function();
			});

			it('returns true for built-in Date instance', () => {
				should(util.types.isDate(new Date())).be.true();
			});
		});

		describe('#isPromise()', () => {
			it('should return true for built-in Promise', () => {
				should(util.types.isPromise(Promise.resolve(42))).be.true();
			});

			it('should return false for Promise like objects', () => {
				should(util.types.isPromise({ then: () => {}, catch: () => {} })).be.false();
			});
		});

		describe('#isRegExp()', () => {
			it('is a function', () => {
				should(util.types.isRegExp).be.a.Function();
			});

			it('returns true for RegExp instance', () => {
				should(util.types.isRegExp(/abc/)).be.true();
			});

			it('returns true for RegExp primitive', () => {
				should(util.types.isRegExp(new RegExp('abc'))).be.true();
			});
		});

		describe('#isGeneratorFunction()', () => {
			it('should return true for generator function', () => {
				console.log(Object.prototype.toString.call(function *foo() {}));
				should(util.types.isGeneratorFunction(function *foo() {})).be.true();
			});

			it('should return false for normal function', () => {
				should(util.types.isGeneratorFunction(function foo() {})).be.false();
			});
		});

		describe('#isGeneratorObject()', () => {
			it('should return true for generator object', () => {
				function *foo() {}
				const generator = foo();
				console.log(Object.prototype.toString.call(generator));
				should(util.types.isGeneratorObject(generator)).be.true();
			});

			it('should return false for any other object', () => {
				should(util.types.isGeneratorObject({})).be.false();
			});
		});

		describe('#isWeakMap()', () => {
			it('should return true for built-in WeakMap', () => {
				const map = new WeakMap();
				should(util.types.isWeakMap(map)).be.true();
			});

			it('should return false for other values', () => {
				should(util.types.isWeakMap({})).be.false();
				should(util.types.isWeakMap(new Map())).be.false();
			});
		});

		describe('#isWeakSet()', () => {
			it('should return true for built-in WeakSet', () => {
				const map = new WeakSet();
				should(util.types.isWeakSet(map)).be.true();
			});

			it('should return false for other values', () => {
				should(util.types.isWeakSet({})).be.false();
				should(util.types.isWeakSet(new Set())).be.false();
			});
		});

		describe('#isTypedArray()', () => {
			it('should return true for built-in typed arrays', () => {
				should(util.types.isTypedArray(new Uint8Array())).be.true();
				should(util.types.isTypedArray(new Uint8ClampedArray())).be.true();
				should(util.types.isTypedArray(new Uint16Array())).be.true();
				should(util.types.isTypedArray(new Uint32Array())).be.true();
				should(util.types.isTypedArray(new Int8Array())).be.true();
				should(util.types.isTypedArray(new Int16Array())).be.true();
				should(util.types.isTypedArray(new Int32Array())).be.true();
				should(util.types.isTypedArray(new Float32Array())).be.true();
				should(util.types.isTypedArray(new Float64Array())).be.true();
			});

			it('should return true for our own Buffer', () => {
				should(util.types.isTypedArray(Buffer.alloc())).be.true();
			});

			it('should return false for other values', () => {
				should(util.types.isTypedArray({})).be.false();
				should(util.types.isTypedArray([])).be.false();
			});
		});

		describe('Typed Arrays', () => {
			it('should correctly check typed arrays', () => {
				should(!util.types.isUint8Array({ [Symbol.toStringTag]: 'Uint8Array' })).be.true();
				should(util.types.isUint8Array(new Uint8Array())).be.true();

				should(!util.types.isUint8ClampedArray({ [Symbol.toStringTag]: 'Uint8ClampedArray' })).be.true();
				should(util.types.isUint8ClampedArray(new Uint8ClampedArray())).be.true();

				should(!util.types.isUint16Array({ [Symbol.toStringTag]: 'Uint16Array' })).be.true();
				should(util.types.isUint16Array(new Uint16Array())).be.true();

				should(!util.types.isUint32Array({ [Symbol.toStringTag]: 'Uint32Array' })).be.true();
				should(util.types.isUint32Array(new Uint32Array())).be.true();

				should(!util.types.isInt8Array({ [Symbol.toStringTag]: 'Int8Array' })).be.true();
				should(util.types.isInt8Array(new Int8Array())).be.true();

				should(!util.types.isInt16Array({ [Symbol.toStringTag]: 'Int16Array' })).be.true();
				should(util.types.isInt16Array(new Int16Array())).be.true();

				should(!util.types.isInt32Array({ [Symbol.toStringTag]: 'Int32Array' })).be.true();
				should(util.types.isInt32Array(new Int32Array())).be.true();

				should(!util.types.isFloat32Array({ [Symbol.toStringTag]: 'Float32Array' })).be.true();
				should(util.types.isFloat32Array(new Float32Array())).be.true();

				should(!util.types.isFloat64Array({ [Symbol.toStringTag]: 'Float64Array' })).be.true();
				should(util.types.isFloat64Array(new Float64Array())).be.true();

				/*
				@todo enable when we have BigInt64 support
				should(!util.types.isBigInt64Array({ [Symbol.toStringTag]: 'BigInt64Array' })).be.true();
				should(util.types.isBigInt64Array(new BigInt64Array)).be.true();

				should(!util.types.isBigUint64Array({ [Symbol.toStringTag]: 'BigUint64Array' })).be.true();
				should(util.types.isBigUint64Array(new BigUint64Array)).be.true();
				*/
			});
		});
	});
});
