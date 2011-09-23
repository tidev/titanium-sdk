#
# Appcelerator Titanium Mobile
# Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# Makefile for kroll-v8-device

LOCAL_PATH := $(call my-dir)

THIS_DIR := $(LOCAL_PATH)

include $(CLEAR_VARS)

LOCAL_MODULE := kroll-v8-device
LOCAL_CFLAGS := $(CFLAGS)
LOCAL_LDLIBS := $(LDLIBS)
LOCAL_SRC_FILES := $(SRC_FILES)

LOCAL_JS_FILES := $(JS_FILES)

LOCAL_STATIC_LIBRARIES := libv8-device

include $(BUILD_SHARED_LIBRARY)

NDK_MODULE_PATH := $(LOCAL_PATH)/../ndk-modules
$(call import-module,libv8-device)
