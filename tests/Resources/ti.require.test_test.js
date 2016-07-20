// local variables and functions which should not be exported
var localVariable = 'localVariable';
var localFunction = function () {
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

// these are actually a side effect, but we can expose to global object
this.globalFunctionFromModule = function () {
	return "globalFunctionFromModule";
};
this.globalStrVarFromModule = "globalStrVarFromModule";
