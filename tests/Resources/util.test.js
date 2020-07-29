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
		util.should.be.an.Object();
	});

	// For copious tests, see https://github.com/nodejs/node/blob/master/test/parallel/test-util-format.js
	describe('#format()', () => {
		it('is a function', () => {
			util.format.should.be.a.Function();
		});

		it('if placeholder has no corresponding argument, don\'t replace placeholder', () => {
			util.format('%s:%s', 'foo').should.eql('foo:%s');
		});

		it('extra arguments are coerced into strings and concatenated delimited by space', () => {
			util.format('%s:%s', 'foo', 'bar', 'baz').should.eql('foo:bar baz');
		});

		it('if first arg is not string, concat all args separated by spaces', () => {
			util.format(1, 2, 3).should.eql('1 2 3');
		});

		it('if only one arg, returned as-is', () => {
			util.format('%% %s').should.eql('%% %s');
		});

		describe('String placeholder', () => {
			it('with int', () => {
				util.format('%s', 1).should.eql('1');
				util.format('%s', 42).should.eql('42');
				util.format('%s %s', 42, 43).should.eql('42 43');
				util.format('%s %s', 42).should.eql('42 %s');
			});

			it('with undefined', () => {
				util.format('%s', undefined).should.eql('undefined');
			});

			it('with null', () => {
				util.format('%s', null).should.eql('null');
			});

			it('with string', () => {
				util.format('%s', 'foo').should.eql('foo');
			});

			it('with string holding int value', () => {
				util.format('%s', '42').should.eql('42');
			});

			it('with floats', () => {
				util.format('%s', 42.0).should.eql('42');
				util.format('%s', 1.5).should.eql('1.5');
				util.format('%s', -0.5).should.eql('-0.5');
			});

			it('with Symbol', () => {
				util.format('%s', Symbol()).should.eql('Symbol()');
				util.format('%s', Symbol('foo')).should.eql('Symbol(foo)');
			});
			// TODO: BigInt
		});

		describe('Number placeholder', () => {
			it('with floats', () => {
				util.format('%d', 42.0).should.eql('42');
				util.format('%d', 1.5).should.eql('1.5');
				util.format('%d', -0.5).should.eql('-0.5');
			});

			it('with ints', () => {
				util.format('%d', 42).should.eql('42');
				util.format('%d %d', 42, 43).should.eql('42 43');
				util.format('%d %d', 42).should.eql('42 %d');
			});

			it('with string holding int value', () => {
				util.format('%d', '42').should.eql('42');
			});

			it('with string holding float value', () => {
				util.format('%d', '42.0').should.eql('42');
			});

			it('with empty string', () => {
				util.format('%d', '').should.eql('0');
			});

			it('with Symbol', () => {
				util.format('%d', Symbol()).should.eql('NaN');
			});

			it('with null', () => {
				util.format('%d', null).should.eql('0');
			});

			it('with undefined', () => {
				util.format('%d', undefined).should.eql('NaN');
			});

			// TODO: BigInt
		});

		describe('Float placeholder', () => {
			it('with floats', () => {
				util.format('%f', 42.0).should.eql('42');
				util.format('%f', 1.5).should.eql('1.5');
				util.format('%f', -0.5).should.eql('-0.5');
			});

			it('with ints', () => {
				util.format('%f', 42).should.eql('42');
				util.format('%f %f', 42, 43).should.eql('42 43');
				util.format('%f %f', 42).should.eql('42 %f');
			});

			it('with string holding int value', () => {
				util.format('%f', '42').should.eql('42');
			});

			it('with string holding float value', () => {
				util.format('%f', '42.0').should.eql('42');
			});

			it('with empty string', () => {
				util.format('%f', '').should.eql('NaN');
			});

			it('with Symbol', () => {
				util.format('%f', Symbol()).should.eql('NaN');
			});

			it('with null', () => {
				util.format('%f', null).should.eql('NaN');
			});

			it('with undefined', () => {
				util.format('%f', undefined).should.eql('NaN');
			});

			// TODO: BigInt
		});

		describe('Integer placeholder', () => {
			it('with ints', () => {
				util.format('%i', 42).should.eql('42');
				util.format('%i %i', 42, 43).should.eql('42 43');
				util.format('%i %i', 42).should.eql('42 %i');
			});

			it('with floats', () => {
				util.format('%i', 42.0).should.eql('42');
				util.format('%i', 1.5).should.eql('1');
				util.format('%i', -0.5).should.eql('-0');
			});

			it('with string holding int value', () => {
				util.format('%i', '42').should.eql('42');
			});

			it('with string holding float value', () => {
				util.format('%i', '42.0').should.eql('42');
			});

			it('with empty string', () => {
				util.format('%i', '').should.eql('NaN');
			});

			it('with Symbol', () => {
				util.format('%i', Symbol()).should.eql('NaN');
			});

			it('with null', () => {
				util.format('%i', null).should.eql('NaN');
			});

			it('with undefined', () => {
				util.format('%i', undefined).should.eql('NaN');
			});

			// TODO: BigInt
		});

		describe('JSON placeholder', () => {
			it('with floats', () => {
				util.format('%j', 42.0).should.eql('42');
				util.format('%j', 1.5).should.eql('1.5');
				util.format('%j', -0.5).should.eql('-0.5');
			});

			it('with ints', () => {
				util.format('%j', 42).should.eql('42');
				util.format('%j %j', 42, 43).should.eql('42 43');
				util.format('%j %j', 42).should.eql('42 %j');
			});

			it('with string holding int value', () => {
				util.format('%j', '42').should.eql('"42"');
			});

			it('with string holding float value', () => {
				util.format('%j', '42.0').should.eql('"42.0"');
			});

			it('with empty string', () => {
				util.format('%j', '').should.eql('""');
			});

			it('with Symbol', () => {
				util.format('%j', Symbol()).should.eql('undefined');
			});

			it('with null', () => {
				util.format('%j', null).should.eql('null');
			});

			it('with undefined', () => {
				util.format('%j', undefined).should.eql('undefined');
			});

			it('with object having circular reference', () => {
				const o = {};
				o.o = o;
				util.format('%j', o).should.eql('[Circular]');
			});

			it('with object throwing Error in toJSON() re-throws Error', () => {
				const o = {
					toJSON: () => {
						throw new Error('Failed!');
					}
				};
				(() => util.format('%j', o)).should.throw('Failed!');
			});

			// TODO: BigInt
		});

		describe('%O - object placeholder', () => {
			it('with int', () => {
				util.format('%O', 42).should.eql('42');
			});

			it('with undefined', () => {
				util.format('%O', undefined).should.eql('undefined');
			});

			it('with null', () => {
				util.format('%O', null).should.eql('null');
			});

			it('with string', () => {
				util.format('%O', 'foo').should.eql('\'foo\'');
			});

			it('with string holding int value', () => {
				util.format('%O', '42').should.eql('\'42\'');
			});

			it('with floats', () => {
				util.format('%O', 42.0).should.eql('42');
				util.format('%O', 1.5).should.eql('1.5');
				util.format('%O', -0.5).should.eql('-0.5');
			});

			it('with Symbol', () => {
				util.format('%O', Symbol()).should.eql('Symbol()');
				util.format('%O', Symbol('foo')).should.eql('Symbol(foo)');
			});

			it('with simple object', () => {
				const obj = {
					foo: 'bar'
				};
				util.format('%O', obj).should.eql('{ foo: \'bar\' }');
			});

			it('with object', () => {
				const obj = {
					foo: 'bar',
					foobar: 1,
					func: function () {}
				};
				util.format('%O', obj).should.eql('{ foo: \'bar\', foobar: 1, func: [Function: func] }');
			});

			it('with nested object', () => {
				const nestedObj2 = {
					foo: 'bar',
					foobar: 1,
					func: [ { a: function () {} } ]
				};
				// FIXME: There's a weird edge case we fail here: when function is at cutoff depth and showHidden is true, we report '[Function: a]', while node reports '[Function]'
				// I don't know why.
				util.format('%O', nestedObj2).should.eql(
					'{ foo: \'bar\', foobar: 1, func: [ { a: [Function: a] } ] }');
			});

			it('with same object twice', () => {
				const obj = {
					foo: 'bar',
					foobar: 1,
					func: function () {}
				};
				util.format('%O %O', obj, obj).should.eql(
					'{ foo: \'bar\', foobar: 1, func: [Function: func] } '
					+ '{ foo: \'bar\', foobar: 1, func: [Function: func] }');
			});
		});

		describe('%o - object placeholder', () => {
			it('with int', () => {
				util.format('%o', 42).should.eql('42');
			});

			it('with undefined', () => {
				util.format('%o', undefined).should.eql('undefined');
			});

			it('with null', () => {
				util.format('%o', null).should.eql('null');
			});

			it('with string', () => {
				util.format('%o', 'foo').should.eql('\'foo\'');
			});

			it('with string holding int value', () => {
				util.format('%o', '42').should.eql('\'42\'');
			});

			it('with floats', () => {
				util.format('%o', 42.0).should.eql('42');
				util.format('%o', 1.5).should.eql('1.5');
				util.format('%o', -0.5).should.eql('-0.5');
			});

			it('with Symbol', () => {
				util.format('%o', Symbol()).should.eql('Symbol()');
				util.format('%o', Symbol('foo')).should.eql('Symbol(foo)');
			});

			it('with simple object', () => {
				const obj = {
					foo: 'bar'
				};
				util.format('%o', obj).should.eql('{ foo: \'bar\' }');
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
					result.should.eql(
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
					result.should.eql(
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
					result.should.eql(
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
					result.should.eql(
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
					result.should.eql(
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
					result.should.eql(
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
			util.inspect.should.be.a.Function();
		});

		it('handles string literal', () => {
			util.inspect('a').should.eql('\'a\'');
		});

		it('handles number literal', () => {
			util.inspect(1).should.eql('1');
		});

		it('handles empty array', () => {
			util.inspect([]).should.eql('[]');
		});

		it('handles array with number values', () => {
			util.inspect([ 1, 2, 3 ]).should.eql('[ 1, 2, 3 ]');
		});

		it('handles array with mixed values', () => {
			util.inspect([ 'a', 2 ]).should.eql('[ \'a\', 2 ]');
		});

		it('handles sparse array', () => {
			// eslint-disable-next-line no-sparse-arrays
			util.inspect([ 1, , 3 ]).should.eql('[ 1, <1 empty item>, 3 ]');
		});

		it('handles sparse array with multiple items missing in a row', () => {
			// eslint-disable-next-line no-sparse-arrays
			util.inspect([ 1,,,, 3 ]).should.eql('[ 1, <3 empty items>, 3 ]');
		});

		it('handles sparse array with multiple separate gaps', () => {
			// eslint-disable-next-line no-sparse-arrays
			util.inspect([ 1,,,, 3, ,, 4 ]).should.eql('[ 1, <3 empty items>, 3, <2 empty items>, 4 ]');
		});

		it('handles array with length > options.maxArrayLength', () => {
			util.inspect([ 1, 2, 3 ], { maxArrayLength: 1 }).should.eql('[ 1, ... 2 more items ]');
		});

		it('handles array with length > options.maxArrayLength and is sparse', () => {
			// eslint-disable-next-line no-sparse-arrays
			util.inspect([ 1,,,, 3, ,, 4 ], { maxArrayLength: 1 }).should.eql('[ 1, ... 7 more items ]');
		});

		it('handles sparse array with length > options.maxArrayLength counting gaps as one item for length', () => {
			// eslint-disable-next-line no-sparse-arrays
			util.inspect([ 1,,,, ], { maxArrayLength: 2 }).should.eql('[ 1, <3 empty items> ]');
			// eslint-disable-next-line no-sparse-arrays
			util.inspect([ 1,,,, 3, ,, 4 ], { maxArrayLength: 2 }).should.eql('[ 1, <3 empty items>, ... 4 more items ]');
			// eslint-disable-next-line no-sparse-arrays
			util.inspect([ 1,,,, 3, ,, 4 ], { maxArrayLength: 3 }).should.eql('[ 1, <3 empty items>, 3, ... 3 more items ]');
			// eslint-disable-next-line no-sparse-arrays
			util.inspect([ 1,,,, 3, ,, 4 ], { maxArrayLength: 4 }).should.eql('[ 1, <3 empty items>, 3, <2 empty items>, ... 1 more item ]');
		});

		it('handles Regexp literal', () => {
			util.inspect(/123/).should.eql('/123/');
		});

		it('handles Regexp literal with flags', () => {
			util.inspect(/123/ig).should.eql('/123/gi');
		});

		it('handles new Regexp instance', () => {
			util.inspect(new RegExp()).should.eql('/(?:)/');
		});

		it('handles object primitive literal', () => {
			util.inspect({}).should.eql('{}');
		});

		it('handles new Object', () => {
			// eslint-disable-next-line no-new-object
			util.inspect(new Object()).should.eql('{}');
		});

		it('handles Map instance', () => {
			util.inspect(new Map()).should.eql('Map {}');
		});

		it('handles Map instance with key/value pair', () => {
			util.inspect(new Map([ [ 'a', 1 ] ])).should.eql('Map { \'a\' => 1 }');
		});

		it('handles empty Set instance', () => {
			util.inspect(new Set()).should.eql('Set {}');
		});

		it('handles Set instance with number values', () => {
			util.inspect(new Set([ 1, 2, 3 ])).should.eql('Set { 1, 2, 3 }');
		});

		it('handles object with custom type tag', () => {
			const baz = Object.create({}, { [Symbol.toStringTag]: { value: 'foo' } });
			util.inspect(baz).should.eql('Object [foo] {}');
		});

		it('handles object with null prototype', () => {
			const baz = Object.create(null, {});
			util.inspect(baz).should.eql('[Object: null prototype] {}');
		});

		it('handles class instance', () => {
			class Bar {}
			util.inspect(new Bar()).should.eql('Bar {}');
		});

		it('handles class instance with custom type tag', () => {
			class Foo {
				get [Symbol.toStringTag]() {
					return 'bar';
				}
			}
			util.inspect(new Foo()).should.eql('Foo [bar] {}');
		});

		it('handles empty function', () => {
			util.inspect(function () {}).should.eql('[Function (anonymous)]');
		});

		it('handles named function', () => {
			util.inspect(function bar() {}).should.eql('[Function: bar]');
		});

		it('handles arrow function', () => {
			util.inspect(() => {}).should.eql('[Function (anonymous)]');
		});

		it('handles function with custom property', () => {
			const myFunc = () => {};
			myFunc.a = 1;
			util.inspect(myFunc).should.eql('[Function: myFunc] { a: 1 }');
		});

		it('handles object with getter property', () => {
			const obj = {};
			// eslint-disable-next-line accessor-pairs
			Object.defineProperty(obj, 'whatever', { get: () => 1, enumerable: true });
			util.inspect(obj).should.eql('{ whatever: [Getter] }');
		});

		it('handles object with setter property', () => {
			const obj = {};
			// eslint-disable-next-line accessor-pairs
			Object.defineProperty(obj, 'whatever2', { set: () => {}, enumerable: true });
			util.inspect(obj).should.eql('{ whatever2: [Setter] }');
		});

		it('handles object with getter/setter property', () => {
			const obj = {};
			Object.defineProperty(obj, 'whatever3', { get: () => 1, set: () => {}, enumerable: true });
			util.inspect(obj).should.eql('{ whatever3: [Getter/Setter] }');
		});

		it('handles object with property holding explicit undefined value', () => {
			const obj = {};
			Object.defineProperty(obj, 'whatever4', { value: undefined, enumerable: true });
			util.inspect(obj).should.eql('{ whatever4: undefined }');
		});

		it('with simple object', () => {
			const obj = {
				foo: 'bar'
			};
			util.inspect(obj).should.eql('{ foo: \'bar\' }');
		});

		it('with same object repeated in an array', () => {
			const a = { id: 1 };
			util.inspect([ a, a ]).should.eql('[ { id: 1 }, { id: 1 } ]');
		});

		it('with object', () => {
			const obj = {
				foo: 'bar',
				foobar: 1,
				func: function () {}
			};
			// In Node 10+, we can sort the properties to ensure order to match, otherwise JSC/V8 return arguments/caller in different order on Functions
			util.inspect(obj, {
				showHidden: true,
				breakLength: Infinity,
				sorted: true
			}).should.eql(
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
			util.inspect(nestedObj2, {
				showHidden: true,
				breakLength: Infinity,
				depth: Infinity,
				sorted: true
			}).should.eql(
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
			util.inspect(nestedObj2, { showHidden: true, breakLength: Infinity }).should.eql(
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
			util.inspect(nestedObj2).should.eql(
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
			util.inspect(nestedObj2).should.eql(
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
			util.inspect(nestedObj2, {}).should.eql(
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
			util.inspect(obj).should.eql('{\n  foo: \'\',\n  foobar: 1,\n  something: \'1\',\n  whatever: \'\',\n  whatever2: \'\',\n  whatever3: \'\'\n}');
		});

		it('with default breakLength just below break point', () => {
			const obj = {
				foo: '',
				foobar: 1,
				something: '1',
				whatever: '',
				whatever2: ''
			};
			util.inspect(obj).should.eql('{ foo: \'\', foobar: 1, something: \'1\', whatever: \'\', whatever2: \'\' }');
		});
	});

	describe('#inherits()', () => {
		it('is a function', () => {
			util.inherits.should.be.a.Function();
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

			should(stream instanceof BaseClass).eql(true);
			should(MyStream.super_).eql(BaseClass);

			stream.on('data', data => {
				data.should.eql('It works!');
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
			util.promisify.should.be.a.Function();
		});

		it('wraps callback function to return promise with resolve', (finished) => {
			function callbackOriginal(argOne, argTwo, next) {
				next(argOne, argTwo);
			}
			const promisified = util.promisify(callbackOriginal);
			const result = promisified(null, 123);
			should(result instanceof Promise).eql(true);
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
			should(result instanceof Promise).eql(true);
			result.then(value => { // eslint-disable-line promise/always-return
				should(value).eql(123);
				finished(new Error('Expected promise to get rejected!'));
			}).catch(err => {
				err.message.should.eql('example');
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
			util.callbackify.should.be.a.Function();
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
					should(err instanceof Error).eql(true);
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
			util.deprecate.should.be.a.Function();
		});

		it('wraps function to emit warning', () => {
			function original(...args) {
				return args;
			}
			const deprecated = util.deprecate(original, 'dont call me Al');
			// this should get called synchronously, so I don't think we need to do any setTimeout/async finished stuff
			process.once('warning', warning => {
				warning.name.should.eql('DeprecationWarning');
				warning.message.should.eql('dont call me Al');
			});
			const result = deprecated(null, 123);
			should(result).eql([ null, 123 ]);
		});

		// TODO: Test that we return original function if process.noDeprecation is true!
	});

	describe('#log()', () => {
		it('is a function', () => {
			util.log.should.be.a.Function();
		});

		it('prepends timestamp to message', () => {
			// Hijack console.log! NOTE: This doesn't work on iOS until we move to obj-c API!
			const original = console.log;
			try {
				console.log = string => {
					string.should.match(/^\d{1,2} \w{3} \d{2}:\d{2}:\d{2} - message$/);
				};
				util.log('message');
			} finally {
				console.log = original;
			}
		});
	});

	describe('#print()', () => {
		it('is a function', () => {
			util.print.should.be.a.Function();
		});

		it('concatenates with no join', () => {
			// Hijack console.log! NOTE: This doesn't work on iOS until we move to obj-c API!
			const original = console.log;
			try {
				console.log = string => {
					string.should.eql('123');
				};
				util.print(1, 2, 3);
			} finally {
				console.log = original;
			}
		});
	});

	describe('#puts()', () => {
		it('is a function', () => {
			util.puts.should.be.a.Function();
		});

		it('concatenates with newline join', () => {
			// Hijack console.log! NOTE: This doesn't work on iOS until we move to obj-c API!
			const original = console.log;
			try {
				console.log = string => {
					string.should.eql('1\n2\n3');
				};
				util.puts(1, 2, 3);
			} finally {
				console.log = original;
			}
		});
	});

	describe('#debug()', () => {
		it('is a function', () => {
			util.debug.should.be.a.Function();
		});

		it('concatenates with newline join', () => {
			// Hijack console.error! NOTE: This doesn't work on iOS until we move to obj-c API!
			const original = console.error;
			try {
				console.error = string => {
					string.should.eql('DEBUG: message');
				};
				util.debug('message');
			} finally {
				console.error = original;
			}
		});
	});

	describe('#error()', () => {
		it('is a function', () => {
			util.error.should.be.a.Function();
		});

		it('concatenates with newline join', () => {
			// Hijack console.error! NOTE: This doesn't work on iOS until we move to obj-c API!
			const original = console.error;
			try {
				console.error = string => {
					string.should.eql('1\n2\n3');
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
				util.types.isAnyArrayBuffer(ab).should.be.true();
			});

			it('should return true for built-in SharedArrayBuffer', () => {
				// SharedArrayBuffer is disabled in all major JS engines due to Spectre & Meltrdown vulnerabilities
			});

			it('should return false for other values', () => {
				util.types.isAnyArrayBuffer({}).should.be.false();
				util.types.isAnyArrayBuffer(new Float32Array()).should.be.false();
			});
		});

		describe('#isArgumentsObject()', () => {
			it('should return true for function arguments object', () => {
				(function () {
					util.types.isArgumentsObject(arguments).should.be.true();
				}());
			});

			it('should return false for Array', () => {
				util.types.isArgumentsObject([]).should.be.false();
			});

			it.allBroken('should return false for object with Symbol.toStringTag of "Arguments"', () => {
				util.types.isArgumentsObject({ [Symbol.toStringTag]: 'Arguments' }).should.be.false();
			});
		});

		describe('#isArrayBuffer()', () => {
			it('should return true for built-in ArrayBuffer instance', () => {
				const ab = new ArrayBuffer();
				util.types.isArrayBuffer(ab).should.be.true();
			});

			it('should return false for other values', () => {
				util.types.isArrayBuffer([]).should.be.false();
				util.types.isArrayBuffer(new Float32Array()).should.be.false();
			});
		});

		describe('#isAsyncFunction()', () => {
			it('should return true for async functions', () => {
				console.log(Object.prototype.toString.call(async () => {}));
				util.types.isAsyncFunction(async () => {}).should.be.true();
			});

			it('should return false for normal functions', () => {
				util.types.isAsyncFunction(() => {}).should.be.false();
			});
		});

		describe('#isNativeError()', () => {
			it('is a function', () => {
				util.types.isNativeError.should.be.a.Function();
			});

			it('returns true for Error instance', () => {
				util.types.isNativeError(new Error()).should.eql(true);
			});

			it('returns true for EvalError instance', () => {
				util.types.isNativeError(new EvalError()).should.eql(true);
			});

			it('returns true for RangeError instance', () => {
				util.types.isNativeError(new RangeError()).should.eql(true);
			});

			it('returns true for ReferenceError instance', () => {
				util.types.isNativeError(new ReferenceError()).should.eql(true);
			});

			it('returns true for SyntaxError instance', () => {
				util.types.isNativeError(new SyntaxError()).should.eql(true);
			});

			it('returns true for TypeError instance', () => {
				util.types.isNativeError(new TypeError()).should.eql(true);
			});

			it('returns true for URIError instance', () => {
				util.types.isNativeError(new URIError()).should.eql(true);
			});

			it('returns false for custom Error subclass', () => {
				class SubError extends Error {}
				util.types.isNativeError(new SubError()).should.eql(false);
			});
		});

		describe('#isNumberObject()', () => {
			it('is a function', () => {
				util.types.isNumberObject.should.be.a.Function();
			});

			it('returns true for boxed Number', () => {
				// eslint-disable-next-line no-new-wrappers
				util.types.isNumberObject(new Number()).should.eql(true);
			});

			it('returns false for primitive Number', () => {
				util.types.isNumberObject(0).should.eql(false);
			});
		});

		describe('#isStringObject()', () => {
			it('is a function', () => {
				util.types.isStringObject.should.be.a.Function();
			});

			it('returns true for boxed String', () => {
				// eslint-disable-next-line no-new-wrappers
				util.types.isStringObject(new String('foo')).should.eql(true);
			});

			it('returns false for primitive String', () => {
				util.types.isStringObject('foo').should.eql(false);
			});
		});

		describe('#isBooleanObject()', () => {
			it('is a function', () => {
				util.types.isBooleanObject.should.be.a.Function();
			});

			it('returns true for boxed Boolean', () => {
				// eslint-disable-next-line no-new-wrappers
				util.types.isBooleanObject(new Boolean(false)).should.eql(true);
			});

			it('returns false for primitive Boolean', () => {
				util.types.isBooleanObject(true).should.eql(false);
			});
		});

		// TODO: Re-enable when we have BigInt support
		// describe('#isBigIntObject()', () => {
		// 	it('is a function', () => {
		// 		util.types.isBigIntObject.should.be.a.Function();
		// 	});

		// 	it('returns true for boxed BigInt', () => {
		// 		// eslint-disable-next-line no-new-wrappers,no-undef
		// 		util.types.isSymbolObject(Object(BigInt(9007199254740991))).should.eql(true);
		// 	});

		// 	it('returns false for BigInt instance', () => {
		// 		// eslint-disable-next-line no-undef
		// 		util.types.isSymbolObject(BigInt(9007199254740991)).should.eql(false);
		// 	});

		// it('returns false for primitive BigInt', () => {
		// 	util.types.isSymbolObject(9007199254740991n).should.eql(false);
		// });
		// });

		describe('#isSymbolObject()', () => {
			it('is a function', () => {
				util.types.isSymbolObject.should.be.a.Function();
			});

			it('returns true for boxed Symbol', () => {
				// eslint-disable-next-line no-new-wrappers
				util.types.isSymbolObject(Object(Symbol('foo'))).should.eql(true);
			});

			it('returns false for primitive Symbol', () => {
				util.types.isSymbolObject(Symbol('foo')).should.eql(false);
			});
		});

		describe('#isBoxedPrimitive()', () => {
			it('is a function', () => {
				util.types.isBoxedPrimitive.should.be.a.Function();
			});

			it('returns false for primitive Boolean', () => {
				util.types.isBoxedPrimitive(false).should.eql(false);
			});

			it('returns true for boxed Boolean', () => {
				// eslint-disable-next-line no-new-wrappers
				util.types.isBoxedPrimitive(new Boolean(false)).should.eql(true);
			});

			it('returns false for primitive Symbol', () => {
				util.types.isBoxedPrimitive(Symbol('foo')).should.eql(false);
			});

			it('returns true for boxed Symbol', () => {
				util.types.isBoxedPrimitive(Object(Symbol('foo'))).should.eql(true);
			});

			// it('returns true for boxed BigInt', () => {
			// 	// eslint-disable-next-line no-undef
			// 	util.types.isBoxedPrimitive(Object(BigInt(5))).should.eql(true);
			// });
		});

		describe('#isSet()', () => {
			it('is a function', () => {
				util.types.isSet.should.be.a.Function();
			});

			it('returns true for Set instance', () => {
				util.types.isSet(new Set()).should.eql(true);
			});
		});

		describe('#isSetIterator()', () => {
			it('should return true if the value is an iterator returned for a built-in Set instance', () => {
				const set = new Set();
				util.types.isSetIterator(set.keys()).should.be.true();
				util.types.isSetIterator(set.values()).should.be.true();
				util.types.isSetIterator(set.entries()).should.be.true();
				util.types.isSetIterator(set[Symbol.iterator]()).should.be.true();
			});

			it('should return false for other iterators', () => {
				const map = new Map();
				util.types.isSetIterator(map.values()).should.be.false();
			});
		});

		describe('#isMap()', () => {
			it('is a function', () => {
				util.types.isMap.should.be.a.Function();
			});

			it('returns true for Map instance', () => {
				util.types.isMap(new Map()).should.eql(true);
			});
		});

		describe('#isMapIterator()', () => {
			it('should return true if the value is an iterator retunred for a built-in Map instance', () => {
				const map = new Map();
				util.types.isMapIterator(map.keys()).should.be.true();
				util.types.isMapIterator(map.values()).should.be.true();
				util.types.isMapIterator(map.entries()).should.be.true();
				util.types.isMapIterator(map[Symbol.iterator]()).should.be.true();
			});

			it('should return false for other iterators', () => {
				const set = new Set();
				util.types.isMapIterator(set.values()).should.be.false();
			});
		});

		describe('#isDataView()', () => {
			const ab = new ArrayBuffer(20);

			it('should return true for built-in DataView instance', () => {
				util.types.isDataView(new DataView(ab)).should.be.true();
			});

			it('should return false for typed array instance', () => {
				util.types.isDataView(new Float64Array()).should.be.false();
			});
		});

		describe('#isDate()', () => {
			it('is a function', () => {
				util.types.isDate.should.be.a.Function();
			});

			it('returns true for built-in Date instance', () => {
				util.types.isDate(new Date()).should.eql(true);
			});
		});

		describe('#isPromise()', () => {
			it('should return true for built-in Promise', () => {
				util.types.isPromise(Promise.resolve(42)).should.be.true();
			});

			it('should return false for Promise like objects', () => {
				util.types.isPromise({ then: () => {}, catch: () => {} }).should.be.false();
			});
		});

		describe('#isRegExp()', () => {
			it('is a function', () => {
				util.types.isRegExp.should.be.a.Function();
			});

			it('returns true for RegExp instance', () => {
				util.types.isRegExp(/abc/).should.eql(true);
			});

			it('returns true for RegExp primitive', () => {
				util.types.isRegExp(new RegExp('abc')).should.eql(true);
			});
		});

		describe('#isGeneratorFunction()', () => {
			it('should return true for generator function', () => {
				console.log(Object.prototype.toString.call(function *foo() {}));
				util.types.isGeneratorFunction(function *foo() {}).should.be.true();
			});

			it('should return false for normal function', () => {
				util.types.isGeneratorFunction(function foo() {}).should.be.false();
			});
		});

		describe('#isGeneratorObject()', () => {
			it('should return true for generator object', () => {
				function *foo() {}
				const generator = foo();
				console.log(Object.prototype.toString.call(generator));
				util.types.isGeneratorObject(generator).should.be.true();
			});

			it('should return false for any other object', () => {
				util.types.isGeneratorObject({}).should.be.false();
			});
		});

		describe('#isWeakMap()', () => {
			it('should return true for built-in WeakMap', () => {
				const map = new WeakMap();
				util.types.isWeakMap(map).should.be.true();
			});

			it('should return false for other values', () => {
				util.types.isWeakMap({}).should.be.false();
				util.types.isWeakMap(new Map()).should.be.false();
			});
		});

		describe('#isWeakSet()', () => {
			it('should return true for built-in WeakSet', () => {
				const map = new WeakSet();
				util.types.isWeakSet(map).should.be.true();
			});

			it('should return false for other values', () => {
				util.types.isWeakSet({}).should.be.false();
				util.types.isWeakSet(new Set()).should.be.false();
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
				util.types.isTypedArray({}).should.be.false();
				util.types.isTypedArray([]).should.be.false();
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
