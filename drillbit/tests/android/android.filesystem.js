describe("Android Ti.Filesystem tests", {
	externalStorageAPI: function() {
		valueOf(Ti.Filesystem.isExternalStoragePresent).shouldBeFunction();
		valueOf(Ti.Filesystem.externalStoragePresent).shouldBeBoolean();
	}
});
