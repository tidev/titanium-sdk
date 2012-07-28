#!/bin/sh
#
# Appcelerator Titanium Mobile
# Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.

HAVE_NDK_STACK=$(type -P ndk-stack &>/dev/null && echo "1" || echo "0")
NDK_STACK="ndk-stack"

if [ "$HAVE_NDK_STACK" = "0" ]; then
	if [ "$ANDROID_NDK" = "" ]; then
		echo "Error: The path to the Android NDK must be set in the ANDROID_NDK environment variable, or you must add the Android NDK to your PATH"
		exit 1
	fi
	NDK_STACK="$ANDROID_NDK/ndk-stack"
fi

THIS_DIR=$(cd "$(dirname "$0")"; pwd)
adb $@ logcat | "$NDK_STACK" -sym $THIS_DIR/../obj/local/armeabi
