/**
 * Test the value of the internal property `__filename`.
 * This property used to return "test.js" but now returns the absolute path
 * based on the Resources directory as it's root.
 * Ti.SDK < 6: "test.js"
 * Ti.SDK >= 6: "/with_subfolder/sub/test.js"
 **/
exports.filename = __filename;