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

	this.name = "network";
	this.tests = [
		{name: "uriComponents"}
	]

	this.uriComponents = function(testRun) {
		valueOf(testRun, encodeURIComponent).shouldBeFunction();
		valueOf(testRun, decodeURIComponent).shouldBeFunction();
		valueOf(testRun, Ti.Network.encodeURIComponent).shouldBeFunction();
		valueOf(testRun, Ti.Network.decodeURIComponent).shouldBeFunction();
		
		// Taken from: http://www.w3schools.com/jsref/jsref_encodeURIComponent.asp
		var uri = "http://w3schools.com/my test.asp?name=ståle&car=saab";
		var encoded = encodeURIComponent(uri);
		valueOf(testRun, encoded).shouldBe(Ti.Network.encodeURIComponent(uri));
		valueOf(testRun, encoded).shouldBe("http%3A%2F%2Fw3schools.com%2Fmy%20test.asp%3Fname%3Dst%C3%A5le%26car%3Dsaab");
		valueOf(testRun, decodeURIComponent(encoded)).shouldBe(uri);
		valueOf(testRun, Ti.Network.decodeURIComponent(encoded)).shouldBe(uri);
		
		// Taken from: https://appcelerator.lighthouseapp.com/projects/32238/tickets/986-implement-tinetworkdecodeencodeuricomponent
		uri = "http://www.google.com?somestring=more&more";
		encoded = encodeURIComponent(uri);
		valueOf(testRun, encoded).shouldBe(Ti.Network.encodeURIComponent(uri));
		valueOf(testRun, encoded).shouldBe("http%3A%2F%2Fwww.google.com%3Fsomestring%3Dmore%26more");
		valueOf(testRun, decodeURIComponent(encoded)).shouldBe(uri);
		valueOf(testRun, Ti.Network.decodeURIComponent(encoded)).shouldBe(uri);

		finish(testRun);
	}
}
