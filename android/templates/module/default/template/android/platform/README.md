Files in this folder are copied directory into the Android build directory
when the Android app is compiled:

    <project-dir>/build/android

You can place files such as res strings or drawable files.

Files in this directory are copied directly on top of whatever files are already
in the build directory, so please be careful that your files don't clobber
essential project files or files from other modules.
