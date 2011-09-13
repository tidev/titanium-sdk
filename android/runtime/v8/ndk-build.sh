#!/bin/sh

NDK_DIR=$1

if [ "$NDK_DIR" = "" ]; then
	NDK_DIR=$ANDROID_NDK
fi

if [ "$NDK_DIR" = "" ]; then
	echo "Error: Android NDK must be either set in the ANDROID_NDK environment variable, or passed as the first argument to this script"
	exit 1
fi

THIS_DIR=$(cd "$(dirname "$0")"; pwd)
"$NDK_DIR/ndk-build" \
	NDK_APPLICATION_MK=$THIS_DIR/Application.mk \
	NDK_PROJECT_PATH=$THIS_DIR \
	NDK_MODULE_PATH=$THIS_DIR/src/ndk-modules \
	TI_DIST_DIR=$(cd "$THIS_DIR/../../../dist"; pwd) \
	V=1 \
	$@
