describe("Ti.Yahoo tests", {
	yqlFlickrCats: asyncTest({
		start: function() {
			Ti.Yahoo.yql('select * from geo.places where text="san francisco, ca"', this.async(function(e) {
				if (e.error) {
					throw e.error;
				}
				
				var data = e.data;
				valueOf(data).shouldNotBeNull();
				valueOf(data.place).shouldNotBeNull();
				valueOf(data.place.name).shouldBe("San Francisco");
			}));
		},
		
		timeout: 10000,
		timeoutError: "Timed out waiting for YQL response"
	})
});
