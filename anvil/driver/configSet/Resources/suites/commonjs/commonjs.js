module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "commonjs";
	this.tests = [
		{name: "test_absolute"},
		{name: "test_cyclic"},
		{name: "test_determinism"},
		{name: "test_exactExports"},
		{name: "test_hasOwnProperty"},
		{name: "test_method"},
		{name: "test_missing"},
		{name: "test_monkeys"},
		{name: "test_nested"},
		{name: "test_relative"},
		{name: "test_transitive"}
	];

	// commonjs test ports - see the commonjs 1.0 test repository
	//	https://github.com/commonjs/commonjs/tree/master/tests/modules/1.0
	//
	// Note that even running these tests depends on certain parts of them passing!
	// If all of these tests fail, as a consequence, there is something seriously
	// wrong with commonjs loading.

	this.test_absolute = function(testRun) {
		var test = require('./absolute/program');
		finish(test.run(testRun, valueOf));
	}

	this.test_cyclic = function(testRun) {
		var test = require('./cyclic/program');
		finish(test.run(testRun, valueOf));
	}

	this.test_determinism = function(testRun) {
		var test = require('./determinism/program');
		finish(test.run(testRun, valueOf));
	}

	this.test_exactExports = function(testRun) {
		var test = require('./exactExports/program');
		finish(test.run(testRun, valueOf));
	}

	this.test_hasOwnProperty = function(testRun) {
		var test = require('./hasOwnProperty/program');
		finish(test.run(testRun, valueOf));
	}

	this.test_method = function(testRun) {
		var test = require('./method/program');
		finish(test.run(testRun, valueOf));
	}

	this.test_missing = function(testRun) {
		var test = require('./missing/program');
		finish(test.run(testRun, valueOf));
	}

	this.test_monkeys = function(testRun) {
		var test = require('./monkeys/program');
		finish(test.run(testRun, valueOf));
	}

	this.test_nested = function(testRun) {
		var test = require('./nested/program');
		finish(test.run(testRun, valueOf));
	}

	this.test_relative = function(testRun) {
		var test = require('./relative/program');
		finish(test.run(testRun, valueOf));
	}

	this.test_transitive = function(testRun) {
		var test = require('./transitive/program');
		finish(test.run(testRun, valueOf));
	}

	// TODO: Commonjs 1.1 extension tests
	// TODO: Titanium extension tests
}
