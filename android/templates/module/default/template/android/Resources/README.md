Files in this folder are copied directory into the compiled product directory
when the Android app is compiled:

    <project-dir>/build/android/bin/assets/Resources/

Files in this directory are copied directly on top of whatever files are already
in the build directory, so please be careful that your files don't clobber
essential project files or files from other modules.
