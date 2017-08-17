#
# Appcelerator Titanium Mobile
# Copyright (c) 2011-2017 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# libv8 (for both ARMv5 and ARMv7a)
LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

# Read android/build/libv8.properties to get v8 version and mode (release or debug)
include $(LOCAL_PATH)/../../../../../build/libv8.properties
V8_VERSION=$(libv8.version)
LIBV8_MODE := $(libv8.mode)
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

# v8_libbase
include $(CLEAR_VARS)
LOCAL_MODULE    := libv8_libbase
LOCAL_SRC_FILES := $(LIBV8_DIR)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE).a
LOCAL_EXPORT_C_INCLUDES := $(LIBV8_DIR)/include
include $(PREBUILT_STATIC_LIBRARY)

# v8_libsampler
include $(CLEAR_VARS)
LOCAL_MODULE    := libv8_libsampler
LOCAL_SRC_FILES := $(LIBV8_DIR)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE).a
LOCAL_EXPORT_C_INCLUDES := $(LIBV8_DIR)/include
LOCAL_STATIC_LIBRARIES := libv8_libbase
include $(PREBUILT_STATIC_LIBRARY)

# v8_base
include $(CLEAR_VARS)
LOCAL_MODULE := libv8_base
LOCAL_SRC_FILES := $(LIBV8_DIR)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE).a
LOCAL_EXPORT_C_INCLUDES := $(LIBV8_DIR)/include
LOCAL_STATIC_LIBRARIES := libv8_libbase libv8_libsampler
include $(PREBUILT_STATIC_LIBRARY)

# v8_libplatform
include $(CLEAR_VARS)
LOCAL_MODULE    := libv8_libplatform
LOCAL_SRC_FILES := $(LIBV8_DIR)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE).a
LOCAL_EXPORT_C_INCLUDES := $(LIBV8_DIR)/include
LOCAL_STATIC_LIBRARIES := libv8_libbase
include $(PREBUILT_STATIC_LIBRARY)

# v8_nosnapshot
include $(CLEAR_VARS)
LOCAL_MODULE    := libv8_nosnapshot
LOCAL_SRC_FILES := $(LIBV8_DIR)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE).a
LOCAL_EXPORT_C_INCLUDES := $(LIBV8_DIR)/include
LOCAL_STATIC_LIBRARIES := libv8_base
include $(PREBUILT_STATIC_LIBRARY)

# v8_builtins_generators
include $(CLEAR_VARS)
LOCAL_MODULE    := libv8_builtins_generators
LOCAL_SRC_FILES := $(LIBV8_DIR)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE).a
LOCAL_EXPORT_C_INCLUDES := $(LIBV8_DIR)/include
LOCAL_STATIC_LIBRARIES := libv8_base
include $(PREBUILT_STATIC_LIBRARY)

# v8_builtins_setup
include $(CLEAR_VARS)
LOCAL_MODULE    := libv8_builtins_setup
LOCAL_SRC_FILES := $(LIBV8_DIR)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE).a
LOCAL_EXPORT_C_INCLUDES := $(LIBV8_DIR)/include
LOCAL_STATIC_LIBRARIES := libv8_builtins_generators
include $(PREBUILT_STATIC_LIBRARY)
