describe("Ti.Network tests", {
	uriComponents: function() {
		valueOf(encodeURIComponent).shouldBeFunction();
		valueOf(decodeURIComponent).shouldBeFunction();
		valueOf(Ti.Network.encodeURIComponent).shouldBeFunction();
		valueOf(Ti.Network.decodeURIComponent).shouldBeFunction();
		
		// Taken from: http://www.w3schools.com/jsref/jsref_encodeURIComponent.asp
		var uri = "http://w3schools.com/my test.asp?name=ståle&car=saab";
		var encoded = encodeURIComponent(uri);
		valueOf(encoded).shouldBe(Ti.Network.encodeURIComponent(uri));
		valueOf(encoded).shouldBe("http%3A%2F%2Fw3schools.com%2Fmy%20test.asp%3Fname%3Dst%C3%A5le%26car%3Dsaab");
		valueOf(decodeURIComponent(encoded)).shouldBe(uri);
		valueOf(Ti.Network.decodeURIComponent(encoded)).shouldBe(uri);
		
		// Taken from: https://appcelerator.lighthouseapp.com/projects/32238/tickets/986-implement-tinetworkdecodeencodeuricomponent
		uri = "http://www.google.com?somestring=more&more";
		encoded = encodeURIComponent(uri);
		valueOf(encoded).shouldBe(Ti.Network.encodeURIComponent(uri));
		valueOf(encoded).shouldBe("http%3A%2F%2Fwww.google.com%3Fsomestring%3Dmore%26more");
		valueOf(decodeURIComponent(encoded)).shouldBe(uri);
		valueOf(Ti.Network.decodeURIComponent(encoded)).shouldBe(uri);
	}
});