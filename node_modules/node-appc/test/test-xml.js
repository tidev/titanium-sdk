/**
 * node-appc - Appcelerator Common Library for Node.js
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

var appc = require('../index'),
	assert = require('assert'),
	DOMParser = require('xmldom').DOMParser,
	dom = new DOMParser().parseFromString(
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<root>\n' +
		'	<string_test color="red">hello</string_test>\n' +
		'	<int_test>123</int_test>\n' +
		'	<float_test>3.14</float_test>\n' +
		'	<bool_true_test>true</bool_true_test>\n' +
		'	<bool_false_test>false</bool_false_test>\n' +
		'	<null_test>null</null_test>\n' +
		'	<empty_test/>\n' +
		'</root>', 'text/xml').documentElement;

describe('xml', function () {
	it('namespace exists', function () {
		appc.should.have.property('xml');
		appc.xml.should.be.an.Object;
	});

	describe('#forEachElement()', function () {
		it('should find all non-element nodes', function () {
			var nodeNames = [];

			appc.xml.forEachElement(dom, function (elem) {
				nodeNames.push(elem.nodeName);
				elem.nodeType.should.equal(appc.xml.ELEMENT_NODE);
			});

			nodeNames.should.eql([
				'string_test',
				'int_test',
				'float_test',
				'bool_true_test',
				'bool_false_test',
				'null_test',
				'empty_test'
			]);
		});
	});

	describe('#parse()', function () {
		it('should properly parse strings', function () {
			appc.xml.parse('hello').should.equal('hello');
		});

		it('should properly parse integers', function () {
			appc.xml.parse('123').should.equal(123);
		});

		it('should properly parse floats', function () {
			appc.xml.parse('3.14').should.equal(3.14);
		});

		it('should properly parse true booleans', function () {
			appc.xml.parse('true').should.equal(true);
		});

		it('should properly parse false booleans', function () {
			appc.xml.parse('false').should.equal(false);
		});

		it('should properly parse nulls', function () {
			var v = appc.xml.parse('null');
			assert(v === null, 'parsing "null" should have returned null, but returned ' + v);
		});
	});

	describe('#getAttr()', function () {
		it('should get a node attribute that exists', function () {
			var n = dom.firstChild;
			while (n && n.nodeType != appc.xml.ELEMENT_NODE) {
				n = n.nextSibling;
			}
			assert(n !== null, 'should have found <string_test> node, but returned null instead');
			appc.xml.getAttr(n, 'color').should.equal('red');
		});

		it('should return null for a non-existent node attribute', function () {
			var n = dom.firstChild;
			while (n && n.nodeType != appc.xml.ELEMENT_NODE) {
				n = n.nextSibling;
			}
			assert(n !== null, 'should have found <string_test> node, but returned null instead');
			appc.xml.getAttr(n, 'doesnotexist').should.equal('');
		});
	});

	describe('#getValue()', function () {
		it('should get node values and return them as the correct type', function () {
			var values = {
				'string_test': 'hello',
				'int_test': 123,
				'float_test': 3.14,
				'bool_true_test': true,
				'bool_false_test': false,
				'null_test': null,
				'empty_test': ''
			};

			appc.xml.forEachElement(dom, function (elem) {
				values.should.have.ownProperty(elem.tagName);
				var v = appc.xml.getValue(elem);
				assert(v == values[elem.tagName], 'element <' + elem.tagName + '> should have a value ' + values[elem.tagName] + ', but got ' + v);
			});
		});
	});
});
