describe("Ti.Yahoo tests", {
	yqlFlickrCats: asyncTest({
		start: function() {
			Ti.Yahoo.yql('select * from flickr.photos.search where text="Cat" limit 10', this.async(function(e) {
				if (e.error) {
					throw e.error;
				}
				
				var data = e.data;
				valueOf(data).shouldNotBeNull();
				valueOf(data.photo).shouldNotBeNull();
				var len = data.photo.length;
				valueOf(len).shouldBeGreaterThan(0);
				valueOf(len).shouldBeLessThanEqual(10);
				
				for (var i = 0; i < len; i++) {
					valueOf(data.photo[i].id).shouldBeString();
				}
			}));
		},
		
		timeout: 10000,
		timeoutError: "Timed out waiting for YQL response"
	})
});