module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "includes";
	this.tests = [
		{name: "relativeDown"},
		{name: "slashToRoot"},
		{name: "dotdotSlash"},
		{name: "dotSlash"},
		{name: "lotsOfDots"},
		{name: "simpleRequire"},
		{name: "secondContextRequire"},
		{name: "multipleRequire"},
		{name: "includeFromUrlWindow", timeout: 10000}
	]

	var testval = false;

	this.relativeDown = function() {
		testval = false;
		valueOf(function(){
			Ti.include('relative_down.js');
		}).shouldNotThrowException();
		valueOf(testval).shouldBeTrue();

		finish();
	}

	this.slashToRoot = function() {
		testval = false;
		valueOf(function(){
			Ti.include('l2/l3/slash_to_root.js');
		}).shouldNotThrowException();
		valueOf(testval).shouldBeTrue();

		finish();
	}

	this.dotdotSlash = function() {
		testval = false;
		valueOf(function(){
			Ti.include('l2/l3/dotdotslash.js');
		}).shouldNotThrowException();
		valueOf(testval).shouldBeTrue();

		finish();
	}

	this.dotSlash = function() {
		testval = false;
		valueOf(function(){
			Ti.include('./dotslash.js');
		}).shouldNotThrowException();
		valueOf(testval).shouldBeTrue();

		finish();
	}

	this.lotsOfDots = function() {
		testval = false;
		valueOf(function(){
			Ti.include('l2/../l2/./l3/lotsofdots.js');
		}).shouldNotThrowException();
		valueOf(testval).shouldBeTrue();

		finish();
	}

	this.simpleRequire = function() {
		valueOf(require).shouldBeFunction();

		var module = require("./module");
		valueOf(module).shouldBeObject();
		valueOf(module.message).shouldBe("test required module");

		finish();
	}

	this.secondContextRequire = function() {
		var callback = new Object();
		callback.passed = finish;
		callback.failed = function(e){
			Ti.API.debug(e);
			valueOf(true).shouldBeFalse();
		};
		if(Ti.Platform.osname === 'android'){
			Ti.UI.createWindow({
				url: "win.js",
				anvilCallback: callback
			}).open();
			// see win.js for the code that sets results.
		}
		else
		{
		//This test relies on cross-context function calls.
		//As such, is it even a proper test? Conditioning out
		//iOS in the meantime.
			Ti.API.warn("Cross-context tests aren't currently being tested in iOS");
			finish();
		}
	}

	this.multipleRequire = function() {
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

		finish();
	}

	this.includeFromUrlWindow = function() {
		// Another cross-context test, will need to enable for iOS later
		if (Ti.Platform.osname === 'android') {
			var win = Ti.UI.createWindow({ url: "window_include.js", passed: false });
			win.addEventListener("open", function(e) {
				valueOf(win.passed).shouldBeTrue();
				finish();
			});
			win.open();
		} else {
			Ti.API.warn("Cross-context tests aren't currently being tested in iOS");
			finish();
		}
	}
}
