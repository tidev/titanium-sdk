describe("Ti.Network.HTTPClient tests", {
	
	apiTest: function() {
		valueOf(Ti.Network.createHTTPClient).shouldNotBeNull();
	},
	
	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/2156-android-invalid-redirect-alert-on-xhr-file-download
	// https://appcelerator.lighthouseapp.com/projects/32238/tickets/1381-android-buffer-large-xhr-downloads
	largeFileWithRedirect: asyncTest({
		start: function() {
			var xhr = Ti.Network.createHTTPClient();
			xhr.setTimeout(30000);
			xhr.onload = this.async(function(e) {
				valueOf(this.responseData.length).shouldBeGreaterThan(0);
			});
			xhr.onerror = this.async(function(e) {
				throw e.error;
			});

			xhr.open('GET','http://www.appcelerator.com/download-win32');
			xhr.send();
		},
		timeout: 30000,
		timeoutError: "Timed out waiting for HTTP download"
	})
});
