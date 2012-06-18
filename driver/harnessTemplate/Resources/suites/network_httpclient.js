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
		{name: "setCookieClearCookieWithMultipleHTTPClients", timeout: 30000}
	]

	this.apiTest = function() {
		valueOf(Ti.Network.createHTTPClient).shouldNotBeNull();

		finish();
	}

	// Test for TIMOB-4513
	this.secureValidateProperty = function() {
		var xhr = Ti.Network.createHTTPClient();
		valueOf(xhr).shouldBeObject();
		valueOf(xhr.validatesSecureCertificate).shouldBeFalse();

		xhr.validatesSecureCertificate = true;
		valueOf(xhr.validatesSecureCertificate).shouldBeTrue();
		xhr.validatesSecureCertificate = false;
		valueOf(xhr.validatesSecureCertificate).shouldBeFalse();

		xhr.setValidatesSecureCertificate(true);
		valueOf(xhr.getValidatesSecureCertificate()).shouldBeTrue();
		xhr.setValidatesSecureCertificate(false);
		valueOf(xhr.getValidatesSecureCertificate()).shouldBeFalse();

		finish();
	}

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2156-android-invalid-redirect-alert-on-xhr-file-download
	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1381-android-buffer-large-xhr-downloads
	this.largeFileWithRedirect = function() {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(true).shouldBeFalse();
		};
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(60000);
		xhr.onload = function(e) {
			valueOf(xhr.responseData.length).shouldBeGreaterThan(0);
			finish();
		};
		xhr.onerror = function(e) {
			callback_error(e);
		};

		xhr.open('GET','http://timobile.appcelerator.com.s3.amazonaws.com/drillbit/moon%20background%203.png');
		xhr.send();
	}

	// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/1649-android-httpclientsend-with-no-argument-causes-npe
	this.emptyPOSTSend = function() {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(true).shouldBeFalse();
		};
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(30000);
		xhr.onload = function(e) {
			valueOf(1).shouldBe(1);
			finish();
		};
		xhr.onerror = function(e) {
			callback_error(e);
		};

		xhr.open('POST','http://www.appcelerator.com');
		xhr.send();
	}

	//https://appcelerator.lighthouseapp.com/projects/32238/tickets/2339
	this.responseHeadersBug = function() {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(true).shouldBeFalse();
		};
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(30000);
		xhr.onload = function(e) {
			if (Ti.Platform.osname !== 'iphone') {
				// not implemented yet for iOS, see https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2535
				var allHeaders = xhr.getAllResponseHeaders();
				valueOf(allHeaders.indexOf('Server:')).shouldBeGreaterThanEqual(0);
				var header = xhr.getResponseHeader('Server');
				valueOf(header.length).shouldBeGreaterThan(0);
			}
			else {
				valueOf(1).shouldBe(1);
			}
			finish();
		};
		xhr.onerror = function(e) {
			callback_error(e);
		};

		xhr.open('GET','http://www.appcelerator.com');
		xhr.send();
	}

	this.requestHeaderMethods = function() {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(true).shouldBeFalse();
		};
		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(30000);
		xhr.onload = function(e) {
			//TODO: set up a server that parrots back the request headers so
			//that we can verfiy what we actually send.
			valueOf(1).shouldBe(1);
			finish();
		};
		xhr.onerror = function(e) {
			callback_error(e);
		};
		xhr.open('GET','http://www.appcelerator.com');
		xhr.setRequestHeader('adhocHeader','notcleared');
		xhr.setRequestHeader('clearedHeader','notcleared');
		valueOf(function() {
			xhr.setRequestHeader('clearedHeader',null);
		}).shouldNotThrowException();
		xhr.send();
	}

	// Confirms that only the selected cookie is deleted
	this.clearCookiePositiveTest = function() {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(true).shouldBeFalse();
		};
		var timer = 0;
		var second_cookie_fn = function(e) {
			var second_cookie_string = this.getResponseHeader('Set-Cookie').split(';')[0];

			try {
				clearTimeout(timer);

				// New Cookie should be different.
				valueOf(cookie_string).shouldNotBe(second_cookie_string);
				finish();
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
	this.clearCookieUnaffectedCheck = function() {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(true).shouldBeFalse();
		};
		var timer = 0;
		var second_cookie_fn = function(e) {
			Ti.API.info("Second Load");
			var second_cookie_string = this.getResponseHeader('Set-Cookie').split(';')[0];
			try {
				clearTimeout(timer);

				// Cookie should be the same
				valueOf(cookie_string).shouldBe(second_cookie_string);
				finish();
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
	this.setCookieClearCookieWithMultipleHTTPClients = function() {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(true).shouldBeFalse();
		};
		var testServer = 'http://appc.me/Test/Cookies/';

		var xhr = Ti.Network.createHTTPClient();
		xhr.setTimeout(30000);
		xhr.onload = function(e) {
			try {
				valueOf(this.responseText).shouldBe('Set 2 cookies');
				var xhr2 = Ti.Network.createHTTPClient();
				xhr2.setTimeout(30000);
				xhr2.onload = function(e) {
					Ti.API.info("Clear Cookie");
					try {
						valueOf(this.responseText).shouldBe('Set 2 cookies to expire a year ago.');
						finish();
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
}
