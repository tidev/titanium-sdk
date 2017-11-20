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
	- $ANDROID_SDK/platform-tools/adb logcat | $ANDROID_NDK/ndk-stack -sym ~/repos/titanium_mobile/android/runtime/v8/obj/local/x86
- Use ToSomething(Context) in place of ToSomething(Isolate)
- Convert to using all of the MaybeLocal<T> APIs
- Look for other deprecated API usage and update
- Write up some docs on how everything works?
- Clean up JavaObject/Proxy/NativeObject hierarchy, duplicated work. Basically JavaObject just needs a special callback that doesn't immediately clean up. We have all these wrap/unwrap methods


Testing V8-inspector/debugger
========
The goal is to be able to debug apps via Chrome Devtools or Studio.
We hook up a websocket server in JSDebugger.java to talk to DevTools. This carries the messages back and forth (basically wbesaockets are the "base" protocol that the isnpector protocol travels over)

- Use multiple terminal tabs/windows:
	- One for logcat with crash symbol conversion to actual stacktraces:
		- $ANDROID_SDK/platform-tools/adb logcat | $ANDROID_NDK/ndk-stack -sym ~/repos/titanium_mobile/android/runtime/v8/obj/local/x86
	- One for running a test app to debug with:
		- ti build -p android --log-level trace --target emulator --device-id AVD_for_Nexus_10_by_Google --debug-host /127.0.0.1:51388
	- One for building the SDK:
		- node scons.js cleanbuild android
- Open Chrome to URL: chrome-devtools://devtools/remote/serve_file/@60cd6e859b9f557d2312f5bf532f6aec5f284980/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:51388/ws
