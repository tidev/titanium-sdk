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
		{name: "uriComponents"},
		{name: "set_CookieResponseHeaders"},
		{name: "getResponseHeaderReturnsNull"},
		{name: "nullRequestHeader"},
		{name: "sendingBlobsAsForm"},
		{name: "uploadFiles"},
		{name: "networkChangeListener"},
		{name: "network_Property"},
		{name: "listeningForHttpRequests"}
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

	//TIMOB-2849
	this.set_CookieResponseHeaders = function(testRun) {
		var testServer = 'http://appc.me/Test/Cookies/';
		var xhr = Ti.Network.createHTTPClient();
		xhr.onload = function(e) {
			valueOf(testRun, this.getResponseHeader('Set-Cookie')).shouldBe('CookieName1=CookieValue1; path=/, CookieName2=CookieValue2; path=/');
			
			finish(testRun);
		};
		xhr.open('GET', testServer + '?count=2&clear=false');
		xhr.send();
	}

	//TIMOB-5807
	this.getResponseHeaderReturnsNull = function(testRun) {
		var url = 'http://tools.dynamicdrive.com/password/example/';
		var request = Titanium.Network.createHTTPClient();
		request.open('GET',url);
		request.send();
		request.onerror = function() {
			if (this.status == 401) {
				valueOf(testRun, this.getResponseHeader('WWW-Authenticate')).shouldBeString();
				
				finish(testRun);
			}
		}
	}

	//TIMOB-6828
	this.nullRequestHeader = function(testRun) {
		valueOf(testRun, function(){
			var xhr = Titanium.Network.createHTTPClient();
			xhr.onload = function(){};
			xhr.open('GET','http://www.appcelerator.com');
			xhr.setRequestHeader('Authorization',null);
			xhr.send();
		}).shouldNotThrowException();

		finish(testRun);
	}

	//TIMOB-6973
	this.sendingBlobsAsForm = function(testRun) {
		valueOf(testRun, function(){
			var xhr = Ti.Network.createHTTPClient({});
			xhr.setTimeout = 1600000;
			xhr.open('POST', 'http://savagelook.com/xhr_test.php');
			xhr.setRequestHeader("ContentType","multipart/form-data");
			xhr.send({
				blobtest: Ti.UI.createImageView({
					image: 'KS_nav_ui.png',
					height: 200,
					width: 200
				}).toBlob()
			});
		}).shouldNotThrowException();

		finish(testRun);
	}

	//TIMOB-7264, TIMOB-7850
	this.uploadFiles = function(testRun) {
		var image = Titanium.Filesystem.getFile(Titanium.Filesystem.resourcesDirectory,'KS_nav_ui.png');     
		var xhr = Titanium.Network.createHTTPClient();
		xhr.setTimeout(20000);
		xhr.onload = function(e)
		{
			valueOf(testRun, this.status).shouldBe(200);
			valueOf(testRun, this.readyState).shouldBe(4);

			finish(testRun);
		};
		xhr.open('POST','https://twitpic.com/api/uploadAndPost');
		xhr.send({media:image,username:'fgsandford1000',password:'sanford1000',message:'check me out'});
	}

	//TIMOB-9108, TIMOB-10321
	this.networkChangeListener = function(testRun) {
		if (Ti.Platform.osname === 'android') {
			Ti.Network.addEventListener("change",function(e) {
				valueOf(testRun, Titanium.Network.online).shouldBeTrue();

				finish(testRun);
			});
			var tab = Ti.UI.createTabGroup();
			var win1 = Ti.UI.createWindow({
				title : 'NetworkStatus Sample',
				backgroundColor : '#fff',
			});
			var tab1 = Ti.UI.createTab({
				title : 'tab1',
				backgroundColor : '#fff',
				window : win1
			});
			tab.addTab(tab1);
			tab.open();
		} else {

			finish(testRun);
		}

	}

	//TIMOB-9864
	this.network_Property = function(testRun) {
		valueOf(testRun, Ti.Network.NETWORK_NONE).shouldBe(0);
		valueOf(testRun, Ti.Network.NETWORK_WIFI).shouldBe(1);
		valueOf(testRun, Ti.Network.NETWORK_MOBILE).shouldBe(2);
		valueOf(testRun, Ti.Network.NETWORK_LAN).shouldBe(3);
		valueOf(testRun, Ti.Network.NETWORK_UNKNOWN).shouldBe(4);

		finish(testRun);
	}

	//TIMOB-7718
	this.listeningForHttpRequests = function(testRun) {
		if (Ti.Platform.osname === 'iphone' || Ti.Platform.osname === 'ipad') {
			valueOf(testRun, function(){
				socket = Titanium.Network.Socket.createTCP({
					host:Ti.Platform.address,
					port:8080,
					listenQueueSize:100,
				});
				socket.listen();
			}).shouldNotThrowException();

			finish(testRun);
		} else {

			finish(testRun);
		}
	}
}
