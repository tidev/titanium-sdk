# Hermes runtime harness

This directory holds a small Android app that runs the native Hermes runtime from `../src/native` on a device. The SDK cannot build an app with Hermes before Phases 2 to 4 of the Hermes plan are done. Until then, this harness is the only way to run the runtime. Delete it when the Titanium test suite runs with Hermes.

The harness replaces three parts of the SDK with stand-ins:

- `app/src/main/java/org/appcelerator/kroll`: minimal versions of the Java classes that the native runtime looks up, for example `KrollProxy` and `KrollRuntime`.
- `app/src/main/cpp/generated/KrollGeneratedBindings.h`: hand-written bindings for the test proxies. They use the same API as the code that kroll-apt will generate in Phase 3.
- `app/src/main/cpp/generated/KrollJS.h`: a small JS kernel in place of `kroll.js`.

The classes in `app/src/main/java/org/appcelerator/kroll/runtime/hermes` are first versions of the classes for Phase 2. `ReferenceTable.java` contains the Java half of the proxy lifetime logic. Read the class comment of `titanium::Proxy` in `../src/native/Proxy.h` first.

## Build and run

You need the Android SDK with NDK `28.1.13356709` and CMake `3.22.1`. Run all commands in this directory.

1. Download the JSI sources: `node ../../../titanium/hermes-services.js update-jsi`
2. Build the app: `ANDROID_HOME=$ANDROID_SDK ../../../gradlew -p . :app:assembleRelease`
3. Find the serial of your device: `adb devices`
4. Install the app and print the report: `./run.sh <serial> release`

The report has one line per test. A line starts with `PASS`, `FAIL` or `INFO`. Use the release build for the report. The debug build writes one log line per proxy, and the device log drops the start of the report.

## What the tests cover

`app/src/main/assets/tests.js` tests the bridge from JS: proxy creation, accessors, creation properties, type conversion in both directions, Java exceptions, events, `inherit()`, modules, indexed properties, the property interceptor, and the `API`, `assets` and `evals` bindings.

`MainActivity.java` tests the calls from Java and the lifetime of proxy pairs. It runs both garbage collectors between the steps. The lifetime tests make sure that:

- A proxy that nobody holds is collected, also if a listener or a property refers back to it.
- A proxy that only Java holds keeps its JS state, and its listeners still run.
- A proxy that only JS holds keeps its Java object.
- 5,000 dropped proxies leave no entry in the Java reference table.
