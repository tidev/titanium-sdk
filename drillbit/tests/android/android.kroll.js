describe("Android Kroll tests", {
	fireSyncEvent: function(e) {
		var x = {y: 0};
		Ti.App.addEventListener("custom_sync_event", function(e) {
			x.y = 1;
		});
		Ti.App.fireSyncEvent("custom_sync_event");
		valueOf(x.y).shouldBe(1);
	}
});