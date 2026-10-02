# iOS vs Android startup notes

## Android

### Build time
At SDK build time, `./android/titanium/prebuild.js` script is run which takes JS files (from `./android/runtime/common/src/js`) and generates C `char*`
  - This is done to "bake in" the source to avoid disk I/O slowdown

### Runtime
`App.java`
- create app info, set up encryption asset helper stuff
- create asset cache
- create V8Runtime
- register external modules (id -> class)
- then call...

`V8Runtime#nativeInit()`
 - from Java down to JNI
 - sets up platform, isolate, debugger, then calls...
`V8Runtime#bootstrap()`
- sets up `EventEmitter` in C code
- creates kroll object, calls into `KrollBindings.cpp` to hang `binding`/`externalBinding` functions for grabbing a builtin/native module
- hangs `EventEmitter`, `DBG`, `runtime`, `log` method properties off `kroll` object
  - (Note that `kroll.log` may not add newlines at end?)

`kroll.js` is parsed then invoked
- holds a function that does initial kernel bootstrapping
- creates a `global.kroll` object
- hangs `NativeModule` off of it which is a way to load the baked in JS code from build time
- hangs `global.Ti` from loading baked-in `titanium.js`
  - This ends up calling `KrollBindings#initTitanium()` which sets up `Proxy`/`KrollProxy`/`KrollModule`/`TitaniumModule` in C
  - Also does bootsrapping of other baked in JS code for extensions like ui/network/properties/locale
  - `bootstrap.js` file is loaded?!
- hangs `global.Module` from loading baked-in `module.js`
  - This effectively sets up our `require()` implementation
- hangs `global.console` from loading baked-in `console.js`
  - piggy-backs on `Ti.API`

back to `V8Runtime#bootstrap()`
- set up `global.global`
- set default `global.__dirname` and `__filename`

back to Java `V8Runtime#initRuntime()`
- start debugger
- load external native modules

... then?
- The root splash screen activity `TiLaunchActivity` calls `TiApplication.launch()` to start the JS runtime.
- which eventually calls from Java -> JNI -> C to `global.Module.runModule()` (or if we have a snapshot, it does `global._startSnapshot(global)`)
- When `TiLaunchActivity` is destroyed, the JS runtime will be terminated.
