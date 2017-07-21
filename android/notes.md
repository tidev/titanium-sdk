Done:
======
- Fix To* calls wrongly converted to As<T>() calls
	- As<T> can replace Cast, or when we check IsSomething() first, since it casts
	- ToSomething() coerces the type
- Replace Cast usage with as<T>()?
- http://stackoverflow.com/questions/15017113/cast-vs-toxxx-for-value-handles-in-v8

TODOs!!!
=====
- Clean up all the debug logging I put in place
- Write up notes on generating debug build of library, using ndk-stack to get line numbers in native crash stack traces
	- ./adb logcat | /Users/cwilliams/Developer/SDKs/android-ndk-r10c/ndk-stack -sym /Users/cwilliams/repos/titanium_mobile/android/runtime/v8/obj/local/x86
- Use ToSomething(Context) in place of ToSomething(Isolate)
- Convert to using all of the MaybeLocal<T> APIs
- Look for other deprecated API usage and update
- Write up some docs on how everything works?
- Clean up JavaObject/Proxy/NativeObject hierarchy, duplicated work. Basically JavaObject just needs a special callback that doesn't immediately clean up. We have all these wrap/unwrap methods
