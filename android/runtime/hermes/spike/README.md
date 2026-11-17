# Hermes spike (Phase 0)

This directory holds a small Android app that loads Hermes and one hand-written proxy. It answers the open questions of Phase 0 of the Hermes plan. It is not part of the SDK build. Delete it when the Hermes runtime in `android/runtime/hermes` replaces it.

## Build and run

You need the Android SDK with NDK `28.1.13356709` and CMake `3.22.1`. Run all commands in this directory.

1. Download the JSI sources: `./fetch-jsi.sh`
2. Build the app: `ANDROID_HOME=$ANDROID_SDK ../../../gradlew -p . :app:assembleDebug :app:assembleRelease`
3. Find the serial of your device: `adb devices`
4. Install the app and print the report: `./run.sh <serial> release`

The report has one line per test. A line starts with `PASS`, `FAIL`, `LANG` or `INFO`.

## Pinned versions

- Hermes engine: `com.facebook.hermes:hermes-android:250829098.0.19` from Maven Central.
- JSI sources: tag `hermes-v250829098.0.19` of `facebook/hermes`, directory `API/jsi/jsi`.
- Compiler: npm package `hermes-compiler@250829098.0.19`.

The older Maven coordinate `com.facebook.react:hermes-android` stops at version 0.82.1. Do not use it.

## Results

The results come from a Pixel 11 Pro (Android 17, arm64, release build) and from an x86_64 emulator (Android 16, debug build). All tests pass on the two devices.

### Question 1: libraries for the four ABIs

Yes. The AAR contains `libhermesvm.so` for `arm64-v8a`, `armeabi-v7a`, `x86` and `x86_64`. The library name is `hermesvm`, not `hermes`. The prefab package is `hermes-engine` and the CMake target is `hermes-engine::hermesvm`.

### Question 2: JSI headers

No. The AAR contains the Hermes headers but no JSI headers. `libhermesvm.so` also needs three more libraries at load time:

- `libjsi.so`: No Maven package outside React Native supplies it. The spike builds it from one source file, `jsi.cpp`, of the same Hermes tag.
- `libfbjni.so`: The AAR pulls it in through `com.facebook.fbjni:fbjni:0.7.0`.
- `libc++_shared.so`: The NDK supplies it. Titanium already ships it.

The Java side must call `NativeLoader.initIfUninitialized(new SystemDelegate())` before the first Hermes call. If it does not, the process aborts with `NativeLoader has not been initialized`. The class comes from `com.facebook.soloader:nativeloader:0.10.5`.

### Question 3: the hermesc compiler

The npm package `hermes-compiler` contains `hermesc` for Linux (`linux64-bin`), macOS (`osx-bin`) and Windows (`win64-bin`). Its version numbers match the Maven versions of the engine. The engine reports bytecode version 98.

Not tested: the spike did not run `hermesc` and did not load a bytecode file. Do this test before Phase 4.

### Question 4: the proxy model

The model works. A proxy class is a plain JS constructor with a plain JS prototype. Methods are host functions on the prototype. Properties are accessors that native code installs with `Object.defineProperty`. The Java object is attached with `jsi::NativeState`.

The tests show these behaviors:

- An accessor reads and writes a field of the Java object.
- A child class inherits methods and accessors through the prototype chain, and `instanceof` works.
- JS code can add a method to a proxy prototype.
- JS code can override an accessor and call the original accessor.
- JS code can set a property that the proxy does not know. The property stays on the JS object.
- A proxy method on an object without native state throws a JS `Error`.
- Native code can create the JS object for a proxy that Java created first, with `jsi::Object::create`.
- An ES `class` can extend a proxy class.

The V8 binding template installs a named property interceptor for a proxy class that has a `@Kroll.interceptor` method (`ProxyBindingV8.cpp.fm`, line 238). This model has no interceptor. For those classes, the generator must wrap the instance in a JS `Proxy` object, which Hermes supports.

### Question 5: finalizers

The destructor of the `jsi::NativeState` runs when Hermes collects the JS object. One call to `collectGarbage` released all 20,000 test proxies. Every destructor ran on the JS thread, also with the concurrent garbage collector (`hades`). The runtime teardown released the remaining objects. The spike measured this with two devices and one workload. Keep the thread assertion in the real runtime.

### Question 6: constructors

No. Hermes rejects `new` on a host function with `TypeError: This function cannot be used as a constructor.` The constructor must be a JS function. The spike creates it from a three-line JS factory that calls a native `__init(this)` function. This costs one extra JS call per proxy.

### Question 7: time and size

Time on the Pixel 11 Pro, release build, three cold starts:

| Step | Time |
| --- | --- |
| Create the runtime | 3 to 6 ms |
| Install the bindings for two classes | about 1 ms |
| Create 20,000 proxies and set one Java-backed property on each | 23 to 27 ms |

Size of the `arm64-v8a` libraries:

| Library | Size |
| --- | --- |
| `libhermesvm.so` | 2.48 MB |
| `libjsi.so` | 0.12 MB |
| `libfbjni.so` | 0.18 MB |
| `libkroll-v8.so` of SDK 14.1.0, which contains V8 and the Titanium bindings | 21.3 MB |

Not measured: the same workload with V8. The size numbers also do not compare like with like, because `libkroll-v8.so` includes about 190 proxy bindings. The Hermes numbers are low enough to continue. Measure the real difference at the first milestone, when the test app runs with the two engines.

## Language support of Hermes 250829098.0.19

The test script evaluates one snippet per feature. These features work: classes with fields and private members, async functions, generators, destructuring, optional chaining, `BigInt`, `Proxy`, `Reflect`, `WeakRef`, typed arrays, RegExp named groups and lookbehind, `Array.prototype.findLast`, `Object.hasOwn`, `Promise.allSettled`, `Intl.NumberFormat`, `Intl.DateTimeFormat` and `Intl.Collator`.

These features do not work:

- The `with` statement (syntax error).
- Async generators and `for await` (syntax error).
- A direct `eval` call cannot read the local variables of its caller.
- `Function.prototype.toString` does not return the source text.
- `FinalizationRegistry`, `SharedArrayBuffer` and `Atomics` do not exist.
- `Array.prototype.toSorted` does not exist.
- `Intl.PluralRules`, `Intl.RelativeTimeFormat` and `Intl.ListFormat` do not exist.

Hermes also has no `console`, `setTimeout`, `queueMicrotask`, `structuredClone`, `TextEncoder` or `TextDecoder`. The embedder supplies these. Titanium already supplies its own `console` and timers.

Promise jobs do not run by themselves. The embedder must create the runtime with `withMicrotaskQueue(true)` and call `drainMicrotasks()` after each call into JS.
