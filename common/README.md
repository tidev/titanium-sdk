
The files under "Resources" are core JavaScript files shared by all platforms Titanium supports. These files are expected to be copied to the Titanium app project's "build" directory for every build, similar to how the app developer's "Resources" files are copied to the "build" directory.

The following scripts will copy these core scripts for every build:
- titanium_mobile/android/cli/commands/_build.js
- titanium_mobile/iphone/cli/commands/_build.js

The "./Resources/ti.main.js" script is executed by Titanium on app startup. This script will load the developer's "app.js" file **after** loading Titanium's core JavaScript extensions and bootstrap files.
