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

	this.yqlFlickrCats = function() {
		var callback_error = function(e){
			Ti.API.debug(e);
			valueOf(true).shouldBeFalse();
		};
		Ti.Yahoo.yql('select * from geo.places where text="san francisco, ca"', function(e) {
			if (e.error) {
				callback_error(e.error);
			}

			var data = e.data;
			valueOf(data).shouldNotBeNull();
			valueOf(data.place).shouldNotBeNull();
			valueOf(data.place.name).shouldBe("San Francisco");
			finish();
		});
	}
}
