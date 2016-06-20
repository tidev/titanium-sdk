/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
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
	// FIXME Get parity across impls. I think all are slightly wrong here.
	((utilities.isAndroid() || utilities.isIOS()) ? it.skip : it)('requireJS.__filename', function () {
		var object = require('ti.require.test_test');
		should(object).be.an.Object;
		should(object.filename).be.a.String;
		should(object.filename).be.eql('ti.require.test_test'); // FIXME I think iOS/Android are more correct here,  but probably should be '/ti.require.test_test.js' for all!
		// See https://nodejs.org/api/globals.html
	});

	it('loads package.json main property when requiring directory', function () {
		var with_package = require('./with_package');
		should(with_package).have.property('name');
		should(with_package.name).be.eql('main.js');
	});

	it('falls back to index.js when requiring directory with no package.json', function () {
		var with_index_js = require('./with_index_js');
		should(with_index_js).have.property('name');
		should(with_index_js.name).be.eql('index.js');
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

	// TODO Add tests for node_modules behavior
	it ('should load a node module by id in node_modules folder living in root', function () {
		var abbrev = require('abbrev');
		should(abbrev).be.a.Function;
		should(abbrev("foo", "fool", "folding", "flop")).eql({ fl: 'flop', flo: 'flop', flop: 'flop', fol: 'folding', fold: 'folding', foldi: 'folding', foldin: 'folding', folding: 'folding', foo: 'foo', fool: 'fool'});
	});
});
