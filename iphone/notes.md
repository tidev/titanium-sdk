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
