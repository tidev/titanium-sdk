describe("Android Ti.Geolocation tests", {
	
	getCurrentPositionException: function() {
		// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2395-android-ks-geolocation-always-says-geo-turned-off-and-location-updates-never-occur
		valueOf( function() {Ti.Geolocation.getCurrentPosition(function(){});} ).shouldNotThrowException();
	}
});
