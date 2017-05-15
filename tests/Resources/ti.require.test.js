/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
var should = require('./utilities/assertions'),
	utilities = require('./utilities/utilities');

describe('requireJS', function () {
	// require should be a function
	it('requireJS.Function', function () {
		should(require).be.a.Function;
	});

	// require should return object
	it('requireJS.Object', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object;
	});

	// require for invalid file should throw error
	it('requireJS.NonObject', function () {
		(function () {
			var object = require('requireJS_test_notfound');
			should(object).not.be.an.Object;
		}).should.throw();
	});

	// require should cache object
	it('requireJS.ObjectCache', function () {
		var object1 = require('ti.require.test_test');
		var object2 = require('ti.require.test_test');
		should(object1).be.an.Object;
		should(object2).be.an.Object;
		should((object1 ==  object2)).be.true;
		should((object1 === object2)).be.true;
	});

	// local function and variable should not be exposed
	it('requireJS.LocalFunc', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object;
		should(object.localVariable).be.undefined;
		should(object.localFunction).be.undefined;
	});

	// public function with 0 argument
	it('requireJS.PublicFunc0', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object;
		should(object.testFunc0).a.Function;
		var result = object.testFunc0();
		should(result).be.a.String;
		should(result).be.eql('testFunc0');
	});

	// public function with 1 argument
	it('requireJS.PublicFunc1', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object;
		should(object.testFunc1).be.a.Function;
		var result = object.testFunc1('A');
		should(result).be.a.String;
		should(result).be.eql('testFunc1 A');
	});

	// public function with 2 arguments
	it('requireJS.PublicFunc2', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object;
		should(object.testFunc2).be.a.Function;
		var result = object.testFunc2('A', 'B');
		should(result).be.a.String;
		should(result).be.eql('testFunc2 A B');
	});

	// public string variable
	it('requireJS.PublicStrVar', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object;
		should(object.testStrVar).be.a.String;
		should(object.testStrVar).be.eql('testVar0');
	});

	// public number variable
	it('requireJS.PublicNumVar', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object;
		should(object.testNumVar).be.a.Number;
		should(object.testNumVar).be.eql(101);
	});

	// public boolean variable
	it('requireJS.PublicBoolVar', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object;
		should(object.testBoolVar).be.a.Boolean;
		should(object.testBoolVar).be.true;
	});

	// public null variable
	it('requireJS.PublicNullVar', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object;
		should(object.testNullVar).be.null;
	});

	// internal __filename
	it('requireJS.__filename', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object;
		should(object.filename).be.a.String;
		should(object.filename).be.eql('/ti.require.test_test.js');
	});

	// internal __filename
	it('requireJS.__dirname', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object;
		should(object.dirname).be.a.String;
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
	it('relative require() from sub directory', function () {
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

	it('loads exact match JS file', function () {
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

	it ('should load a node module by id in node_modules folder living at same level as requirer', function () {
		var abbrev = require('abbrev');
		should(abbrev).be.a.Function;
		should(abbrev("foo", "fool", "folding", "flop")).eql({ fl: 'flop', flo: 'flop', flop: 'flop', fol: 'folding', fold: 'folding', foldi: 'folding', foldin: 'folding', folding: 'folding', foo: 'foo', fool: 'fool'});
	});

	it('loads native module by id', function () {
		var object = require('facebook');
		should(object).have.property('apiName');
		// Of course, the module's apiName is wrong, so we can't test that
		// should(object.apiName).be.eql('facebook');
		should(object).have.property('uid');
	});

	// TODO Add a test for requiring a node module up one level from requiring file!

	it('loads path using legacy fallback if first segment matches native module id and wasn\'t found inside module', function () {
		var object = require('facebook/example');
		should(object).have.property('name');
		should(object.name).be.eql('facebook/example.js');
	});

	it('require from node_modules should not break the app', function() {
		var object = require('bar');
		should(object).have.property('name');
		should(object.name).be.eql('bar');
		should(object).have.property('baz');
		var baz = object.baz;
		should(baz).have.property('foo');
		should(baz.foo.filename).be.eql('/node_modules/foo/index.js')
	});

	it('require should prefer closest node_modules', function() {
		// require('bar') will require package baz under node_modules/bar/node_modules
		// require('bax') should not point to this version of baz but to node_modules/baz
		var object = require('bar');
		should(object).have.property('name');
		should(object.name).be.eql('bar');
		should(object).have.property('baz');
		var baz = object.baz;
		should(baz.name).be.eql('baz');
		should(baz.filename).be.eql('/node_modules/bar/node_modules/baz/index.js')
		should(baz.dirname).be.eql('/node_modules/bar/node_modules/baz')
		var baz2 = require('baz');
		should(baz2.name).be.eql('baz');
		should(baz2.filename).be.eql('/node_modules/baz/index.js');
		should(baz2.dirname).be.eql('/node_modules/baz');
	});
});
