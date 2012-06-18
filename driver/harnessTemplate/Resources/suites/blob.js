module.exports = new function() {
	var finish;
	var valueOf;
	this.init = function(testUtils) {
		finish = testUtils.finish;
		valueOf = testUtils.valueOf;
	}

	this.name = "blob";
	this.tests = [
		{name: "testBlob"}
	]

	this.testBlob = function() {
		// TIMOB-9175 -- nativePath should be null for non-file Blobs.
		// The inverse case is tested in filesystem.js.
		valueOf(function() {
            var myBlob = Ti.createBuffer({
                value: "Use a string to build a buffer to make a blob."}).toBlob();
            valueOf(myBlob.nativePath).shouldBeNull();
        }).shouldNotThrowException();

		finish();
	}
}
