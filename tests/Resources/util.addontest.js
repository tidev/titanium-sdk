/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* global Ti */
/* eslint no-unused-expressions: "off" */
'use strict';

var should = require('./utilities/assertions'); // eslint-disable-line no-unused-vars
let util;

describe.only('util', () => {
	it('should be required as core module', () => {
		util = require('util');
		util.should.be.an.Object;
	});

	// For copious tests, see https://github.com/nodejs/node/blob/master/test/parallel/test-util-format.js
	describe('#format()', () => {
		it('is a function', () => {
			util.format.should.be.a.Function;
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

		it('string placeholder for int', () => {
			util.format('%s', 1).should.eql('1');
			util.format('%s', 42).should.eql('42');
			util.format('%s %s', 42, 43).should.eql('42 43');
			util.format('%s %s', 42).should.eql('42 %s');
		});

		it('string placeholder for undefined', () => {
			util.format('%s', undefined).should.eql('undefined');
		});

		it('string placeholder for string', () => {
			util.format('%s', 'foo').should.eql('foo');
		});

		it('string placeholder for string int', () => {
			util.format('%s', '42').should.eql('42');
		});

		it('Number placeholder for floats', () => {
			util.format('%d', 42.0).should.eql('42');
			util.format('%d', 1.5).should.eql('1.5');
			util.format('%d', -0.5).should.eql('-0.5');
		});

		it('Number placeholder for ints', () => {
			util.format('%d', 42).should.eql('42');
			util.format('%d %d', 42, 43).should.eql('42 43');
			util.format('%d %d', 42).should.eql('42 %d');
		});

		it('Number placeholder for string int', () => {
			util.format('%d', '42').should.eql('42');
		});

		it('Number placeholder for string float', () => {
			util.format('%d', '42.0').should.eql('42');
		});

		it('Number placeholder for empty string', () => {
			util.format('%d', '').should.eql('0');
		});

		it('Number placeholder for Symbol', () => {
			util.format('%d', Symbol()).should.eql('NaN');
		});
	});

	describe('#inspect()', () => {
		it('is a function', () => {
			util.inspect.should.be.a.Function;
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
			const baz = Object.create(null, { [Symbol.toStringTag]: { value: 'foo' } });
			util.inspect(baz).should.eql('[foo] {}');
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
	});
});
