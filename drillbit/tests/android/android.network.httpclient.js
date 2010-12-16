describe("Android HTTPClient tests", {
	
	//https://appcelerator.lighthouseapp.com/projects/32238/tickets/2589-major-regression-in-android-sdk-15-httpclient
	notEncodeUrl: function() {
		var url = "http://www.appcelerator.com/a/b/c;jsessionid=abcdefg";
		var xhr = Ti.Network.createHTTPClient();
		xhr.autoEncodeUrl = false;
		xhr.open('GET', url);
		valueOf(xhr.location).shouldBe(url);
	}, 

	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1491-android-auto-encode-network-urls
	encodeUrl: function() {
		var url = 'http://developer.appcelerator.com/sub2.php?uname=ld@appcelerator.com.com&appname=testt&desc=test&success=why&datesub=2010/08/01&phoneid=1';
		var encoded = 'http://developer.appcelerator.com/sub2.php?uname=ld%40appcelerator.com.com&appname=testt&desc=test&success=why&datesub=2010%2F08%2F01&phoneid=1';
		var xhr = Ti.Network.createHTTPClient();
		xhr.open('GET', url);
		valueOf(xhr.location).shouldBe(encoded);
	}
});
