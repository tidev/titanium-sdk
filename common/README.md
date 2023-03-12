# Common JS SDK files

The files under "Resources" are core JavaScript files shared by all platforms Titanium supports. These files are expected to be copied to the Titanium app project's "build" directory for every build, similar to how the app developer's "Resources" files are copied to the "build" directory.

The following scripts will copy these core scripts for every build:

- titanium_mobile/android/cli/commands/_build.js
- titanium_mobile/iphone/cli/commands/_build.js

For both of these core entry files, we generate a rollup bundle to combine all of the referenced scripts into one single file.

## ti.kernel.js

This file is the set of common "boot" scripts. These files are loaded by each platform to set up the core kernel of the SDK. This typically involves:

- defining the core variables/globals
- Hooking the global `Titanium`/`Ti` object (with lazy properties for the namespaces)
- Setting up EventEmitter
- Implementing `require` via the `Module` class. Eventual app entry points then are launched through `Module.runModule`

The scripts here need to expose a bootstrap function that can be called so we can defer references to things like `kroll.binding` until we execute the main `bootstrap` function. Otherwise the platforms would need to define more of the JS environment natively in advance.

**NOTE:** These files rely on appcelerator/babel-plugin-transform-titanium to help deal with platform differences through the use of `OS_IOS` and `OS_ANDROID` guards. It is the evntual goal to try and remove any need to platform-sepcific code here.

## ti.main.js

This file is the entry point for the app **after** the kernel is loaded.

The "./Resources/ti.main.js" script is executed by Titanium on app startup. This script will load the developer's "app.js" file **after** loading Titanium's core JavaScript extensions and bootstrap files.

### *.bootstrap.js files

`ti.main.js` attempts to load and execute any files with the suffix `.bootstrap.js` in advance of loading the `app.js`. This is a way for apps to hook pre-launch code/behaviors.
