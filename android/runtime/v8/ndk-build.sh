#!/bin/sh

if [ "$ANDROID_NDK" = "" ]; then
	echo "Error: The path to the Android NDK must be set in the ANDROID_NDK environment variable"
	exit 1
fi

THIS_DIR=$(cd "$(dirname "$0")"; pwd)
"$ANDROID_NDK/ndk-build" \
	NDK_APPLICATION_MK=$THIS_DIR/Application.mk \
	NDK_PROJECT_PATH=$THIS_DIR \
	NDK_MODULE_PATH=$THIS_DIR/src/ndk-modules \
	TI_DIST_DIR=$(cd "$THIS_DIR/../../../dist"; pwd) \
	V=1 \
	$@
