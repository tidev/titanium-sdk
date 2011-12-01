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

		var module = require("./module");
		valueOf(module).shouldBeObject();
		valueOf(module.message).shouldBe("test required module");
	},
	secondContextRequire_as_async: function(callback) {
		if(Ti.Platform.osname === 'android'){
			Ti.UI.createWindow({
				url: "win.js",
				drillbitCallback: callback
			}).open();
			// see win.js for the code that sets results.
		}
		else
		{
		//This test relies on cross-context function calls.
		//As such, is it even a proper test? Conditioning out
		//iOS in the meantime.
			Ti.API.warn("Cross-context tests aren't currently being tested in iOS");
			callback.passed();
		}
	},
	multipleRequire: function() {
		valueOf(require).shouldBeFunction();

		var module1 = require("counter");
		valueOf(module1).shouldBeObject();
		valueOf(module1.increment).shouldBeFunction();
		valueOf(module1.increment()).shouldBe(1);
		valueOf(module1.increment()).shouldBe(2);

		var module2 = require("counter");
		valueOf(module2).shouldBeObject();
		valueOf(module2.increment).shouldBeFunction();
		valueOf(module2.increment()).shouldBe(3);
	},
	includeFromUrlWindow: asyncTest({
		start: function(callback) {
			// Another cross-context test, will need to enable for iOS later
			if (Ti.Platform.osname === 'android') {
				var win = Ti.UI.createWindow({ url: "window_include.js", passed: false });
				win.addEventListener("open", this.async(function(e) {
					valueOf(win.passed).shouldBeTrue();
				}));
				win.open();
			} else {
				Ti.API.warn("Cross-context tests aren't currently being tested in iOS");
				callback.passed();
			}
		},
		timeout: 10000,
		timeoutError: "Timed out waiting for window to open"
	})
});
