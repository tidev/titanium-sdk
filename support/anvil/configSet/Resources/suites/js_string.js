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

	this.name = "js_string";
	this.tests = [
		{name: "search_case_insensitive"}
	]

	//KitchenSink: Platform
	this.search_case_insensitive = function(testRun) {
		var mystring = "Add to Address Book";
		valueOf(testRun, mystring.search(/ss/i)).shouldBe(12);
		valueOf(testRun, mystring.search(/ess/i)).shouldBe(11);
		valueOf(testRun, mystring.search(/ress/i)).shouldBe(10);
		valueOf(testRun, mystring.search(/dress/i)).shouldBe(9);
		valueOf(testRun, mystring.search(/ddress/i)).shouldBe(8);
		valueOf(testRun, mystring.search(/address/i)).shouldBe(7);
		valueOf(testRun, mystring.search(/address /i)).shouldBe(7);
		valueOf(testRun, mystring.search(/ddress/)).shouldBe(8);

		finish(testRun);
	}
}
