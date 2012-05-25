describe("Ti.Blob tests", {
    // TIMOB-9175 -- nativePath should be null for non-file Blobs.
    // The inverse case is tested in filesystem.js.
    nativePathForNonFileBlob: function() {
        valueOf(function() {
            var myBlob = Ti.createBuffer({ 
                value: "Use a string to build a buffer to make a blob."}).toBlob();
            valueOf(myBlob.nativePath).shouldBeNull();
        }).shouldNotThrowException();
    }
});
