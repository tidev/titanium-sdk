/* globals OS_IOS */
// On iOS, JSExport-exposed methods on Ti (and other ObjcModule subclasses)
// require the correct `self` receiver when invoked. Storing a reference to
// the method and calling it later — e.g. `const fn = Ti.createBuffer; fn({})`
// — loses the receiver, and JavaScriptCore throws
// "self type check failed for Objective-C instance method".
//
// Wrap such methods in a JS function that rebinds the receiver to the
// owning module, so `fn({})` works the same as `Ti.createBuffer({})`.
if (OS_IOS) {
	const originalCreateBuffer = Titanium.createBuffer;
	Titanium.createBuffer = function (args) {
		return originalCreateBuffer.call(Titanium, args);
	};
}