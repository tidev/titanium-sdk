KrollObject
============
- Stored as private data/member in TiObjectRef/JSObjectRef
- Holds a propsObject field on Obj-C side, which is a JSObjectRef/TiObjectRef
- propsObject is stored under '__TI' on the JS side (the JSObjectRef that wraps the KrollObject)
- We explicitly avoid letting JS get or set to that key/property (__TI)

Proxy hash / __PR
-----------
- This is stored as __TI.__PR on the JSObject wrapping the KrollObject.
- Used by:
	- invokeCallbackForKey
	- noteObject
	- forgetObjectForTiString
	- objectForTiString
- Effectively this is a special place we store TiProxy/KrollCallback objects. I'm not entirely sure *why* we store them here, since for example in KrollSetProperty we still set the key/value pair normally as well.


Events / __EV
-------
- We store event listeners in an JSObjectRef. It is stored as __TI.__EV on the JSObject that wraps the KrollObject.
- Format:
{
	'eventName': [KrollCallback1, KrollCallback2],
	'eventName2': [KrollCallback3]
}

__EX
---------------
This appears to be some hack used to mix modules together. The code in require is commented out for now.

But it would store __TI.__PR.__EX as the JS Object from the loaded module, and when getProperty was called we would look in that object if it existed.


Model
--------

JSObjectRef (the JS object wrapping our proxy)
|- KrollObject (private data/ptr on native side)
|- __TI (special property to hold internal private Titanium values)
	|- __EV (object to hold event listeners: event names and the callbacks to fire for that event)
	|- __PR (holds TiProxy/KrollCallback objects)
		|- __EX (holds module exports when combining native and commonjs modules)



==========================================================================
// FIXME With the new iOS Obj-c API proxies, the hasOwnProperty/Object.getOwnPropertyNames() stuff is all fucked up
// Ti.Platform is an instance of a type/class
// It has no "prototype" property, but has a "__proto__".
// Properties like 'address' or 'createUUID()' are *NOT* own properties of the Ti.Platform object (an instance of PlatformModule)
// Those *are* own properties of Ti.Platform.__proto__!
// This is akin to the idea that:
// Object.getOwnPropertyNames(new Object()) -> []; (this is equivalent to Object.getOwnPropertyNames({}))
// But to get Object "instance" functions, we do Object.getOwnPropertyNames(Object.prototype);
//
// So what can I do? modules are kind of this funky weird singleton instances of proxies.
// Can we treat them as static/class-level properties/methods? and then export the "class" and not an instance?
// (If so, how would we handle event listeners/firing?)
//
// I can try and fix it so that we point Ti.Platform.prototype -> Ti.Platform.__proto__, but does that fix anything?
// Not really, and it looks like this is exactly what Android does too.
//
// So how do Android and iOS differ?
// - On iOS Ti.Platform is an instance of "PlatformModule" (it's __proto__)
//   - The methods/properties hang on the PlatformModule prototype;
//   - The PlatformModule's constructor is a generated "PlatformModuleConstructor"
//   - In other words, Ti.Platform is actually an instance of a "PlatformModule", which extends ObjcProxy < Object
// - On Android, Ti.Platform is an instance of "KrollModule" (it's __proto__)
//   - SOME of the properties hang off the singleton instance itself
//   - constants like BATTERY_STATE_CHARGING hang off Ti.Platform.__proto__! As do functions!
//
// So what does all of this mean? Who is right? Neither?!
//
// I think for modules, we could err on methods/properties being hung off instance OR class-level.
// This is because they're special singletons
// Let's look at a proxy like Ti.Network.HTTPClient for more clarity:
// - constants like DONE should probably be "class-level" (So basically we should access like Ti.Network.HTTPClient.DONE)
// - methods and properties should be hung off the "instance" (So basically we do: client.send(); in mdn doc terms, this would be off the prototype!)
//
// So for Ti.Platform:
// - Object.getOwnPropertyNames(Ti.Platform) = [BATTERY_STATE_FULL, BATTERY_STATE_UNKNOWN, etc]
// - Object.getOwnPropertyNames(Ti.Platform.__proto__) = [canOpenURL(), address, name, etc]
//
// (Of course, we address *all* of these in a way that looks static! (i.e. not off __proto__))
