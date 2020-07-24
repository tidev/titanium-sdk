/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
/* eslint-env mocha */
/* eslint no-unused-expressions: "off" */
'use strict';
var should = require('./utilities/assertions');

describe('require()', function () {
	it('exists as a Function at top-level', function () {
		should(require).be.a.Function();
	});

	it('returns an Object', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object();
	});

	it('throws when requiring invalid file', function () {
		(function () {
			var object = require('requireJS_test_notfound');
			should(object).not.be.an.Object();
		}).should.throw();
	});

	// require should cache object
	it('caches results for same module id', function () {
		var object1 = require('ti.require.test_test');
		var object2 = require('ti.require.test_test');
		should(object1).be.an.Object();
		should(object2).be.an.Object();
		should(object1 ==  object2).be.true(); // eslint-disable-line eqeqeq
		should(object1 === object2).be.true();
	});

	// local function and variable should not be exposed
	it('does not expose un-exported local variable or function', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object();
		should(object.localVariable).be.undefined();
		should(object.localFunction).be.undefined();
	});

	// public function with 0 argument
	it('does expose exported function', function () {
		var object = require('ti.require.test_test'),
			result;
		should(object).be.an.Object();
		should(object.testFunc0).a.Function();
		result = object.testFunc0();
		should(result).be.a.String();
		should(result).be.eql('testFunc0');
	});

	// public function with 1 argument
	// Windows Phone 10 crashed here once
	it('does expose exported function accepting single argument', function () {
		var object = require('ti.require.test_test'),
			result;
		should(object).be.an.Object();
		should(object.testFunc1).be.a.Function();
		result = object.testFunc1('A');
		should(result).be.a.String();
		should(result).be.eql('testFunc1 A');
	});

	// public function with 2 arguments
	it('does expose exported function accepting two arguments', function () {
		var object = require('ti.require.test_test'),
			result;
		should(object).be.an.Object();
		should(object.testFunc2).be.a.Function();
		result = object.testFunc2('A', 'B');
		should(result).be.a.String();
		should(result).be.eql('testFunc2 A B');
	});

	// public string variable
	it('does expose exported String variable', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object();
		should(object.testStrVar).be.a.String();
		should(object.testStrVar).be.eql('testVar0');
	});

	// public number variable
	it('does expose exported Number variable', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object();
		should(object.testNumVar).be.a.Number();
		should(object.testNumVar).be.eql(101);
	});

	// public boolean variable
	it('does expose exported Boolean variable', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object();
		should(object.testBoolVar).be.a.Boolean();
		should(object.testBoolVar).be.true();
	});

	// public null variable
	it('does expose exported null variable', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object();
		should(object.testNullVar).be.null();
	});

	it('exposes __filename inside required module', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object();
		should(object.filename).be.a.String();
		should(object.filename).be.eql('/ti.require.test_test.js');
	});

	it('exposes __dirname isnide required module', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object();
		should(object.dirname).be.a.String();
		should(object.dirname).be.eql('/');
	});

	it('loads package.json main property when requiring directory', function () {
		var with_package = require('./with_package');
		should(with_package).have.property('name');
		should(with_package.name).be.eql('main.js');
		should(with_package.filename).be.eql('/with_package/main.js');
		should(with_package.dirname).be.eql('/with_package');
	});

	it('falls back to index.js when requiring directory with no package.json', function () {
		var with_index_js = require('./with_index_js');
		should(with_index_js).have.property('name');
		should(with_index_js.name).be.eql('index.js');
		should(with_index_js.filename).be.eql('/with_index_js/index.js');
		should(with_index_js.dirname).be.eql('/with_index_js');
	});

	// TIMOB-23512
	// Windows Phone 10 crashes here!
	it.windowsPhoneBroken('relative require() from sub directory', function () {
		var with_index_js = require('./with_index_js/sub1');
		should(with_index_js).have.property('name');
		should(with_index_js.name).be.eql('sub1.js');
		should(with_index_js.sub).be.eql('sub2.js');
		// Was also failing if same file had multiple relative requires
		should(with_index_js.sub3).be.eql('sub3.js');
		should(with_index_js.filename).be.eql('/with_index_js/sub1.js');
		should(with_index_js.dirname).be.eql('/with_index_js');
	});

	it('falls back to index.json when requiring directory with no package.json or index.js', function () {
		var with_index_json = require('./with_index_json');
		should(with_index_json).have.property('name');
		should(with_index_json.name).be.eql('index.json');
	});

	// Windows Phone 10 crashes before even starting this test!
	it.windowsPhoneBroken('loads exact match JS file', function () {
		var exact_js = require('./with_package/index.js');
		should(exact_js).have.property('name');
		should(exact_js.name).be.eql('index.js');
		should(exact_js.filename).be.eql('/with_package/index.js');
		should(exact_js.dirname).be.eql('/with_package');
	});

	it('loads exact match JSON file', function () {
		var package_json = require('./with_package/package.json');
		should(package_json).have.property('main');
		should(package_json.main).be.eql('./main.js');
	});

	it('loads .js with matching file basename if no exact match', function () {
		var with_index_js = require('./with_index_js/index');
		should(with_index_js).have.property('name');
		should(with_index_js.name).be.eql('index.js');
		should(with_index_js.filename).be.eql('/with_index_js/index.js');
		should(with_index_js.dirname).be.eql('/with_index_js');
	});

	it('loads .json with matching file basename if no exact or .js match', function () {
		var with_index_json = require('./with_index_json/index');
		should(with_index_json).have.property('name');
		should(with_index_json.name).be.eql('index.json');
	});

	it('loads file under Titanium CommonJS module containing moduleid.js file', function () {
		var object = require('commonjs.legacy.package/main');
		should(object).have.property('name');
		should(object.name).be.eql('commonjs.legacy.package/main.js');
	});

	// Crashes Windows Desktop
	it.windowsDesktopBroken('should load a node module by id in node_modules folder living at same level as requirer', function () {
		var abbrev = require('abbrev');
		should(abbrev).be.a.Function();
		should(abbrev('foo', 'fool', 'folding', 'flop')).eql({ fl: 'flop', flo: 'flop', flop: 'flop', fol: 'folding', fold: 'folding', foldi: 'folding', foldin: 'folding', folding: 'folding', foo: 'foo', fool: 'fool' });
	});

	// FIXME We have no native ti.identity module for windows!
	it.windowsMissing('loads native module by id', function () {
		var object = require('ti.identity');
		should(object).have.property('apiName');
		// Of course, the module's apiName is wrong, so we can't test that
		// should(object.apiName).be.eql('Ti.Identity');
		should(object).have.property('authenticate');
	});

	// TODO Add a test for requiring a node module up one level from requiring file!

	it.windowsPhoneBroken('loads path using legacy fallback if first segment matches native module id and wasn\'t found inside module', function () {
		var object = require('ti.identity/example');
		should(object).have.property('name');
		should(object.name).be.eql('ti.identity/example.js');
	});

	it('require from node_modules should not break the app', function () {
		var object = require('bar'),
			baz;
		should(object).have.property('name');
		should(object.name).be.eql('bar');
		should(object).have.property('baz');
		baz = object.baz;
		should(baz).have.property('foo');
		should(baz.foo.filename).be.eql('/node_modules/foo/index.js');
	});

	it('should prefer closest node_modules', function () {
		// require('bar') will require package baz under node_modules/bar/node_modules
		// require('bax') should not point to this version of baz but to node_modules/baz
		var object = require('bar'),
			baz,
			baz2;
		should(object).have.property('name');
		should(object.name).be.eql('bar');
		should(object).have.property('baz');
		baz = object.baz;
		should(baz.name).be.eql('baz');
		should(baz.filename).be.eql('/node_modules/bar/node_modules/baz/index.js');
		should(baz.dirname).be.eql('/node_modules/bar/node_modules/baz');
		baz2 = require('baz');
		should(baz2.name).be.eql('baz');
		should(baz2.filename).be.eql('/node_modules/baz/index.js');
		should(baz2.dirname).be.eql('/node_modules/baz');
	});

	it('should not fail when exports is falsey', function () {
		var files = [
				{ filename: 'empty-double', expected: '' },
				{ filename: 'empty-single', expected: '' },
				{ filename: 'false', expected: false },
				{ filename: 'nan', expected: NaN },
				{ filename: 'null', expected: null },
				{ filename: 'undefined', expected: undefined },
				{ filename: 'zero', expected: 0 }
			],
			obj,
			result;
		for (obj in files) {
			obj = files[obj];
			should.doesNotThrow(
				// eslint-disable-next-line no-loop-func
				function () {
					result = require('./fixtures/' + obj.filename); // eslint-disable-line security/detect-non-literal-require
				}
			);
			if (obj.filename === 'nan') {
				isNaN(result).should.be.true();
			}  else {
				should(result).be.exactly(obj.expected);
			}
		}
	});

	it('JSON-based require() with single-quotes', function () {
		var amber = require('./json_files/amber');
		should(amber).have.property('sdk');
		should(amber.sdk).be.eql('7.4.0.v20180627024922');
	});

	it('should handle directory with package.json main pointing at directory with index.js', function () {
		const result = require('./package_with_main_dir');
		should(result).have.property('success');
		should(result.success).eql(true);
	});
});
