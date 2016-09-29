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

	this.name = "android_network_httpclient";
	this.tests = [
		{name: "notEncodeUrl"},
		{name: "encodeUrl"}
	]

	//https://appcelerator.lighthouseapp.com/projects/32238/tickets/2589-major-regression-in-android-sdk-15-httpclient
	this.notEncodeUrl = function(testRun) {
		var url = "http://www.appcelerator.com/a/b/c;jsessionid=abcdefg";
		var xhr = Ti.Network.createHTTPClient();
		xhr.autoEncodeUrl = false;
		xhr.open('GET', url);
		valueOf(testRun, xhr.location).shouldBe(url);

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1491-android-auto-encode-network-urls
	this.encodeUrl = function(testRun) {
		var url = 'http://developer.appcelerator.com/sub2.php?uname=ld@appcelerator.com.com&appname=testt&desc=test&success=why&datesub=2010/08/01&phoneid=1';
		var encoded = 'http://developer.appcelerator.com/sub2.php?uname=ld%40appcelerator.com.com&appname=testt&desc=test&success=why&datesub=2010%2F08%2F01&phoneid=1';
		var xhr = Ti.Network.createHTTPClient();
		xhr.open('GET', url);
		valueOf(testRun, xhr.location).shouldBe(encoded);

		finish(testRun);
	}
}
