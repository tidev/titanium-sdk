
The `./build/android` directory is treated like a gradle project's `./src/main` directory.
These files will be bundled into the module's built AAR library and copied into the built app's APK.

Adding files to the below folder will add them to APK's root "assets" folder.
(Note that a Titanium app's files under the `Resources` directory are copied to the APK's `assets/Resources`.)

    <project-dir>/build/android/assets

The below folders are an example on how to add resource files to the APK's "res" folder.

    <project-dir>/build/android/res/drawable
    <project-dir>/build/android/res/raw
    <project-dir>/build/android/res/xml

Prebuilt C/C++ `*.so` libraries must go under the following folder to be bundled with the AAR and APK.

    <project-dir>/build/android/jniLibs

Android AIDL code generation files go under the following folder. The build system will automatically
generate Java code for them when the app that is built.

    <project-dir>/build/android/aidl

Android "RenderScript" files (aka: `*.rs` files) go under the below folder.

    <project-dir>/build/android/rs
