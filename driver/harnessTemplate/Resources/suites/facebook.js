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

	this.name = "facebook";
	this.tests = [
		{name: "buttonStyleConstants"}
	]

	this.buttonStyleConstants = function(testRun) {
		valueOf(testRun, Ti.Facebook.BUTTON_STYLE_NORMAL).shouldBeNumber();
        valueOf(testRun, Ti.Facebook.BUTTON_STYLE_WIDE).shouldBeNumber();

        valueOf(testRun, function() {
            var button = Ti.Facebook.createLoginButton({ style: Ti.Facebook.BUTTON_STYLE_NORMAL });
        }).shouldNotThrowException();

        valueOf(testRun, function() {
            var button = Ti.Facebook.createLoginButton({ style: Ti.Facebook.BUTTON_STYLE_WIDE })
        }).shouldNotThrowException();

		finish(testRun);
	}
}
