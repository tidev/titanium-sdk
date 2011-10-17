/*global describe, Ti, valueOf */
var testval = false;
describe("Ti.include tests", {
	relativeDown: function() {
		testval = false;
		valueOf(function(){
			Ti.include('relative_down.js');
		}).shouldNotThrowException();
		valueOf(testval).shouldBeTrue();
	},
	slashToRoot: function() {
		testval = false;
		valueOf(function(){
			Ti.include('l2/l3/slash_to_root.js');
		}).shouldNotThrowException();
		valueOf(testval).shouldBeTrue();
	},
	dotdotSlash: function() {
		testval = false;
		valueOf(function(){
			Ti.include('l2/l3/dotdotslash.js');
		}).shouldNotThrowException();
		valueOf(testval).shouldBeTrue();
	},
	dotSlash: function() {
		testval = false;
		valueOf(function(){
			Ti.include('./dotslash.js');
		}).shouldNotThrowException();
		valueOf(testval).shouldBeTrue();
	},
	lotsOfDots: function() {
		testval = false;
		valueOf(function(){
			Ti.include('l2/../l2/./l3/lotsofdots.js');
		}).shouldNotThrowException();
		valueOf(testval).shouldBeTrue();
	},
	simpleRequire: function() {
		valueOf(require).shouldBeFunction();

		var module = require("module");
		valueOf(module).shouldBeObject();
		valueOf(module.message).shouldBe("test required module");
	}
});
