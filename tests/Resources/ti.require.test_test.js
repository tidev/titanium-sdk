/* eslint-env node */
/* eslint no-unused-vars: "off" */
'use strict';
// local variables and functions which should not be exported
var localVariable = 'localVariable';
var localFunction = function () { // eslint-disable-line func-style
	return 'localFunction';
};

// public functions which should be exported
exports.testFunc0 = function () {
	return 'testFunc0';
};
exports.testFunc1 = function (arg1) {
	return 'testFunc1 ' + arg1;
};
exports.testFunc2 = function (arg1, arg2) {
	return 'testFunc2 ' + arg1 + ' ' + arg2;
};

// test for internal __filename
exports.filename = __filename;
exports.dirname = __dirname;

// public variables which should be exported
exports.testStrVar = 'testVar0';
exports.testNumVar = 101;
exports.testBoolVar = true;
exports.testNullVar = null;

// FIXME: So apparently we unofficially support the ability to hang off global by referencing "this"
// Using babel-preset-env breaks this as it resolves the top-level "this" to "undefined" and inlines that
// Without it you could do:
// it('require global as this binding', function () {
// var object = require('ti.require.test_test');
// should(object).be.an.Object();
// should(globalFunctionFromModule).be.a.Function();
// should(globalStrVarFromModule).be.a.String();
// });
// this.globalFunctionFromModule = function () {
// 	return "globalFunctionFromModule";
// };
// this.globalStrVarFromModule = "globalStrVarFromModule";

// these are actually a side effect, but we can hang things off the global object
// NOTE: Titanium used to support "this" as global too, but babel transpile breaks that
global.globalFunctionFromModule = function () {
	return 'globalFunctionFromModule';
};
global.globalStrVarFromModule = 'globalStrVarFromModule';
