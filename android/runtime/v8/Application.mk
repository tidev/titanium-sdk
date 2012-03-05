#
# Appcelerator Titanium Mobile
# Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# Entry point Makefile for ndk-build

APP_BUILD_SCRIPT = src/native/Android.mk
TARGET_PLATFORM = android-8
APP_STL := stlport_shared
APP_ABI := armeabi armeabi-v7a

TARGET_DEVICE := device
APP_OPTIM := release
TI_DEBUG := 1
