#
# Appcelerator Titanium Mobile
# Copyright (c) 2011-2018 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# libv8 (for both ARMv5 and ARMv7a)
LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

# Fetch V8 "version" and release/debug "mode" from generated "V8Settings.mk" file.
# Use these settings to determine path to V8 library to compile with below.
#include $(LOCAL_PATH)/../../../generated/V8Settings.mk
include $(LOCAL_PATH)/V8Settings.mk
LIBV8_DIR := $(TI_DIST_DIR)/android/libv8/$(LIBV8_VERSION)/$(LIBV8_MODE)

# https://jira.appcelerator.org/browse/TIMOB-15263
LOCAL_DISABLE_FORMAT_STRING_CHECKS=true

SIMPLIFIED_ARCH := $(TARGET_ARCH_ABI)

# Turn "armeabi-v7a" to "arm" when looking for correct lib folder
ifeq ($(TARGET_ARCH_ABI),armeabi-v7a)
SIMPLIFIED_ARCH := arm
endif

# Turn "armeabi" to "arm" when looking for correct lib folder
# FIXME We don't really support plain ARM, as per https://android.googlesource.com/platform/external/v8/+/master/Android.mk#24
ifeq ($(TARGET_ARCH_ABI),armeabi)
SIMPLIFIED_ARCH := arm
endif

# Turn "arm64-v8a" to "arm64" when looking for correct lib folder
ifeq ($(TARGET_ARCH_ABI),arm64-v8a)
SIMPLIFIED_ARCH := arm64
endif

# v8_monolith
include $(CLEAR_VARS)
LOCAL_MODULE    := libv8_monolith
LOCAL_SRC_FILES := $(LIBV8_DIR)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE).a
LOCAL_EXPORT_C_INCLUDES := $(LIBV8_DIR)/include
include $(PREBUILT_STATIC_LIBRARY)
