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

	this.name = "network_httpclient";
	this.tests = [
		{name: "apiTest"},
		{name: "secureValidateProperty"},
		{name: "largeFileWithRedirect", timeout: 60000},
		{name: "emptyPOSTSend", timeout: 30000},
		{name: "responseHeadersBug", timeout: 30000},
		{name: "requestHeaderMethods", timeout: 30000},
		{name: "clearCookiePositiveTest", timeout: 30000},
		{name: "clearCookieUnaffectedCheck", timeout: 30000},
		{name: "setCookieClearCookieWithMultipleHTTPClients", timeout: 30000},
		{name: "callbackTestForGETMethod", timeout: 30000},
		{name: "callbackTestForPOSTMethod", timeout: 30000}
	]

	this.apiTest = function(testRun) {
		valueOf(testRun, Ti.Network.createHTTPClient).shouldNotBeNull();

		finish(testRun);
	}

	// Test for TIMOB-4513
	this.secureValidateProperty = function(testRun) {
		var xhr = Ti.Network.createHTTPClient();
		valueOf(testRun, xhr).shouldBeObject();
		valueOf(testRun, xhr.validatesSecureCertificate).shouldBeFalse();

		xhr.validatesSecureCertificate = true;
		valueOf(testRun, xhr.validatesSecureCertificate).shouldBeTrue();
		xhr.validatesSecureCertificate = false;
		valueOf(testRun, xhr.validatesSecureCertificate).shouldBeFalse();

		xhr.setValidatesSecureCertificate(true);
		valueOf(testRun, xhr.getValidatesSecureCertificate()).shouldBeTrue();
		xhr.setValidatesSecureCertificate(false);
		valueOf(testRun, xhr.getValidatesSecureCertificate()).shouldBeFalse();

		finish(testRun);
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2156-android-invalid-redirect-alert-on-xhr-file-download
	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1381-android-buffer-large-xhr-downloads
	this.largeFileWithRedirect = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(60000);
		xhr.onload = function(e) {
			valueOf(testRun, xhr.responseData.length).shouldBeGreaterThan(0);
			finish(testRun);
		};
		xhr.onerror = function(e) {
			callback_error(e);
		};

		xhr.open('GET','http://timobile.appcelerator.com.s3.amazonaws.com/drillbit/moon%20background%203.png');
		xhr.send();
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/1649-android-httpclientsend-with-no-argument-causes-npe
	this.emptyPOSTSend = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(30000);
		xhr.onload = function(e) {
			valueOf(testRun, 1).shouldBe(1);
			finish(testRun);
		};
		xhr.onerror = function(e) {
			callback_error(e);
		};

		xhr.open('POST','http://www.appcelerator.com');
		xhr.send();
	}

	//https://appcelerator.lighthouseapp.com/projects/32238/tickets/2339
	this.responseHeadersBug = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(30000);
		xhr.onload = function(e) {
			if (Ti.Platform.osname !== 'iphone') {
				// not implemented yet for iOS, see https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2535
				var allHeaders = xhr.getAllResponseHeaders();
				valueOf(testRun, allHeaders.indexOf('Server:')).shouldBeGreaterThanEqual(0);
				var header = xhr.getResponseHeader('Server');
				valueOf(testRun, header.length).shouldBeGreaterThan(0);
			}
			else {
				valueOf(testRun, 1).shouldBe(1);
			}
			finish(testRun);
		};
		xhr.onerror = function(e) {
			callback_error(e);
		};

		xhr.open('GET','http://www.appcelerator.com');
		xhr.send();
	}

	this.requestHeaderMethods = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(30000);
		xhr.onload = function(e) {
			//TODO: set up a server that parrots back the request headers so
			//that we can verfiy what we actually send.
			valueOf(testRun, 1).shouldBe(1);
			finish(testRun);
		};
		xhr.onerror = function(e) {
			callback_error(e);
		};
		xhr.open('GET','http://www.appcelerator.com');
		xhr.setRequestHeader('adhocHeader','notcleared');
		xhr.setRequestHeader('clearedHeader','notcleared');
		valueOf(testRun, function() {
			xhr.setRequestHeader('clearedHeader',null);
		}).shouldNotThrowException();
		xhr.send();
	}

	// Confirms that only the selected cookie is deleted
	this.clearCookiePositiveTest = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var timer = 0;
		var second_cookie_fn = function(e) {
			var second_cookie_string = this.getResponseHeader('Set-Cookie').split(';')[0];

			try {
				clearTimeout(timer);

				// New Cookie should be different.
				valueOf(testRun, cookie_string).shouldNotBe(second_cookie_string);
				finish(testRun);
			} catch (e) {
				callback_error(e);
			}
		};

		var xhr = Ti.Network.createHTTPClient();
		var done = false;
		var cookie_string;
		xhr.setTimeout(30000);
		xhr.onload = function(e) {
			cookie_string = this.getResponseHeader('Set-Cookie').split(';')[0];
			xhr.clearCookies("https://my.appcelerator.com");
			xhr.onload = second_cookie_fn;
			xhr.open('GET', 'https://my.appcelerator.com/auth/login');
			xhr.send();
		};
		xhr.onerror = function(e) {
			clearTimeout(timer);
			callback_error(e);
		};
		xhr.open('GET','https://my.appcelerator.com/auth/login');
		xhr.send();
	}

	// Confirms that only the selected cookie is deleted
	this.clearCookieUnaffectedCheck = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var timer = 0;
		var second_cookie_fn = function(e) {
			Ti.API.info("Second Load");
			var second_cookie_string = this.getResponseHeader('Set-Cookie').split(';')[0];
			try {
				clearTimeout(timer);

				// Cookie should be the same
				valueOf(testRun, cookie_string).shouldBe(second_cookie_string);
				finish(testRun);
			} catch (e) {
				callback_error(e);
			}
		};

		var xhr = Ti.Network.createHTTPClient();
		var done = false;
		var cookie_string;
		xhr.setTimeout(30000);
		xhr.onload = function(e) {
			cookie_string = this.getResponseHeader('Set-Cookie').split(';')[0];
			xhr.clearCookies("http://www.microsoft.com");
			xhr.onload = second_cookie_fn;
			xhr.open('GET', 'https://my.appcelerator.com/auth/login');
			xhr.send();
		};
		xhr.onerror = function(e) {
			clearTimeout(timer);
			callback_error(e);
		};
		xhr.open('GET','https://my.appcelerator.com/auth/login');
		xhr.send();
	}

	// http://jira.appcelerator.org/browse/TIMOB-2849
	this.setCookieClearCookieWithMultipleHTTPClients = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var testServer = 'http://appc.me/Test/Cookies/';

		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(30000);
		xhr.onload = function(e) {
			try {
				valueOf(testRun, this.responseText).shouldBe('Set 2 cookies');
				var xhr2 = Ti.Network.createHTTPClient();
				xhr2.setTimeout(30000);
				xhr2.onload = function(e) {
					Ti.API.info("Clear Cookie");
					try {
						valueOf(testRun, this.responseText).shouldBe('Set 2 cookies to expire a year ago.');
						finish(testRun);
					} catch (e) {
						callback_error(e);
					}
				}
				xhr2.open('GET', testServer + '?count=2&clear=true');
				xhr2.send();
			} catch(e) {
				callback_error(e);
			}
		};

		xhr.open('GET', testServer + '?count=2&clear=false');
		xhr.send();
	}

	// http://jira.appcelerator.org/browse/TIMOB-11751
	this.callbackTestForGETMethod = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(30000);
		var dataStreamFinished = false;
		xhr.onreadystatechange = function(e) {
			if (this.readyState == this.DONE && dataStreamFinished) {
				finish(testRun);
			}
		};
		xhr.ondatastream = function(e) {
			if (!e.progress) {
				callback_error("Errors in ondatastream");
			}
			if (e.progress >= 0.99) {
				dataStreamFinished = true;
			}
		};
		xhr.onerror = function(e) {
			callback_error(e);
		};

		xhr.open('GET','http://www.appcelerator.com/assets/The_iPad_App_Wave.pdf');
		xhr.send();
	}

	this.callbackTestForPOSTMethod = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(30000);
		var sendStreamFinished = false;
		xhr.onreadystatechange = function(e) {
			if (this.readyState == this.DONE && sendStreamFinished) {
				finish(testRun);
			}
		};
		xhr.onsendstream = function(e) {
			if (!e.progress) {
				callback_error("Errors in onsendstream");
			}
			if (e.progress >= 0.99) {
				sendStreamFinished = true;
			}
		};
		xhr.onerror = function(e) {
			callback_error(e);
		};

		var buffer = Ti.createBuffer({
			length : 1024 * 10
		}).toBlob();

		xhr.open('POST', 'https://twitpic.com/api/uploadAndPost');
		xhr.send({
			data : buffer,
			username : 'fgsandford1000',
			password : 'sanford1000',
			message : 'check me out'
		});
	}
}
