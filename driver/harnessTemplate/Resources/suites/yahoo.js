module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "yahoo";
	this.tests = [
		{name: "yqlFlickrCats", timeout: 10000}
	]

	this.yqlFlickrCats = function(testRun) {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(testRun, true).shouldBeFalse();
		};
		Ti.Yahoo.yql('select * from geo.places where text="san francisco, ca"', function(e) {
			if (e.error) {
				callback_error(e.error);
			}

			var data = e.data;
			valueOf(testRun, data).shouldNotBeNull();
			valueOf(testRun, data.place).shouldNotBeNull();
			valueOf(testRun, data.place.name).shouldBe("San Francisco");
			finish(testRun);
		});
	}
}
