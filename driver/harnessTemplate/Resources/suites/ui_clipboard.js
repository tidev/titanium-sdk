/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
 
module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "ui_clipboard";
	this.tests = [
		{name: "setAndGetText"},
		{name: "clearText"},
		{name: "setAndGetHTML"},
		{name: "urlData"}
	]

	this.setAndGetText = function(testRun) {
		Ti.UI.Clipboard.setText('hello');
        valueOf(testRun, Ti.UI.Clipboard.hasText()).shouldBeTrue();
        valueOf(testRun, Ti.UI.Clipboard.getText()).shouldBe('hello');

		finish(testRun);
	}

	this.clearText = function(testRun) {
		 valueOf(testRun, function() {
            Ti.UI.Clipboard.clearText();
        }).shouldNotThrowException();
            valueOf(testRun, Ti.UI.Clipboard.hasText()).shouldBeFalse();
            // Return value of getText() varies by platform: TIMOB-9224
            // So we can't test it, but at least it shouldn't throw an exception.
        valueOf(testRun, function() {
            Ti.UI.Clipboard.getText();
        }).shouldNotThrowException();

		finish(testRun);
	}

    // Using setData to store text with a mime type.
	this.setAndGetHTML = function(testRun) {
		// Clear all data first.
        Ti.UI.Clipboard.clearData();
        Ti.UI.Clipboard.setData('text/html', "<p>How is <em>this</em> for data?</p>");
        valueOf(testRun, Ti.UI.Clipboard.hasData('text/html')).shouldBeTrue();
        valueOf(testRun, Ti.UI.Clipboard.getData('text/html'))
            .shouldBe("<p>How is <em>this</em> for data?</p>");

		finish(testRun);
	}

    // Data with mimeType 'text/url-list' or 'url' is treated as a URL on iOS, so 
    // follows a different code path than plain text or images.
	this.urlData = function(testRun) {
		Ti.UI.Clipboard.clearData();
        Ti.UI.Clipboard.setData('text/url-list', "http://www.appcelerator.com");
        valueOf(testRun, Ti.UI.Clipboard.getData('text/url-list')).shouldBe("http://www.appcelerator.com");

		finish(testRun);
	}
}
