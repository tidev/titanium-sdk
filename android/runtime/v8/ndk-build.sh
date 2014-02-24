#!/bin/sh
#
# Appcelerator Titanium Mobile
# Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.

if [ "$ANDROID_NDK" = "" ]; then
	echo "Error: The path to the Android NDK must be set in the ANDROID_NDK environment variable"
	exit 1
fi

# We setup the path to the android platform in SConstruct and pass it along to here
# via common.xml. But if you call ndk-build.sh directly, you don't get that benefit,
# so we try to work it out here.
if [ "$ANDROID_PLATFORM" = "" ]; then

	if [ "$ANDROID_SDK" = "" ]; then

		ADB=`which adb`
		if [ -n $ADB ]; then
			ANDROID_SDK=$(dirname $(dirname $ADB))
		fi

		if [ "$ANDROID_SDK" = "" ]; then
			echo "Error: The path to the Android SDK platform must be set in the ANDROID_PLATFORM environment variable (e.g. /opt/android-sdk-macosx/platforms/android-10)"
			exit 1
		fi
	fi
	export ANDROID_PLATFORM="$(cd "$ANDROID_SDK"; pwd)/platforms/android-10"
fi

THIS_DIR=$(cd "$(dirname "$0")"; pwd)

ARGS=
if [ "$NUM_CPUS" != "" ]; then
	ARGS="-j $NUM_CPUS"
fi

"$ANDROID_NDK/ndk-build" \
	NDK_APPLICATION_MK=$THIS_DIR/Application.mk \
	NDK_PROJECT_PATH=$THIS_DIR \
	NDK_MODULE_PATH=$THIS_DIR/src/ndk-modules \
	TI_DIST_DIR=$(cd "$THIS_DIR/../../../dist"; pwd) \
	$ARGS \
	$@
