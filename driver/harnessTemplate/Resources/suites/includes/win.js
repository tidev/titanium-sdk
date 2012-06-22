// http://jira.appcelerator.org/browse/TIMOB-5434
var callback = Ti.UI.currentWindow.anvilCallback;
var testval = false;
require("module"); // return value not important -- we're testing whether an include() after a require() is run in wrong context.
Ti.include("root.js"); // sets testval to true
if (testval) {
	callback.passed();
} else {
	callback.failed("testval did not receive 'true' from included 'root.js'");
}


