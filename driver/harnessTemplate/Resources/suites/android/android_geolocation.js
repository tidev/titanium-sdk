module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "android_geolocation";
	this.tests = [
		{name: "getCurrentPositionException"}
	]

	this.getCurrentPositionException = function(testRun) {
		// https://appcelerator.lighthouseapp.com/projects/32238-titanium-mobile/tickets/2395-android-ks-geolocation-always-says-geo-turned-off-and-location-updates-never-occur
		valueOf(testRun,  function() {Ti.Geolocation.getCurrentPosition(function(){});} ).shouldNotThrowException();

		finish(testRun);
	}
}
