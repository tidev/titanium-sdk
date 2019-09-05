#
# Appcelerator Titanium Mobile
# Copyright (c) 2011-2018 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# libv8 (for both ARMv5 and ARMv7a)
LOCAL_PATH := $(call my-dir)

define GetFromPkg
$(shell node -p "require('$(LOCAL_PATH)/../../../../../package.json').$(1)")
endef

include $(CLEAR_VARS)

# Read android/package.json to get v8 version and mode (release or debug)
V8_VERSION=$(call GetFromPkg,v8.version)
LIBV8_MODE := $(call GetFromPkg,v8.mode)
LIBV8_DIR := $(TI_DIST_DIR)/android/libv8/$(V8_VERSION)/$(LIBV8_MODE)

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
