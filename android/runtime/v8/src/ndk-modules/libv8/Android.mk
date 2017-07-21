#
# Appcelerator Titanium Mobile
# Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# libv8 (for both ARMv5 and ARMv7a)
LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

V8_VERSION=5.1.281.59
LIBV8_DIR := ../../../../../../dist/android/libv8/$(V8_VERSION)

# https://jira.appcelerator.org/browse/TIMOB-15263
LOCAL_DISABLE_FORMAT_STRING_CHECKS=true

LIBV8_MODE := release
SUFFIX :=

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

ifeq ($(NDK_DEBUG),1)
LIBV8_MODE := debug
SUFFIX := _g
endif

# Uncomment the libicu* when using V8 with ICU/i18n baked in

# libicudata
#include $(CLEAR_VARS)
#LOCAL_MODULE := libicudata
#LOCAL_SRC_FILES := $(LIBV8_DIR)/$(LIBV8_MODE)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE)$(SUFFIX).a
#include $(PREBUILT_STATIC_LIBRARY)

# libicuuc
#include $(CLEAR_VARS)
#LOCAL_MODULE := libicuuc
#LOCAL_SRC_FILES := $(LIBV8_DIR)/$(LIBV8_MODE)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE)$(SUFFIX).a
#LOCAL_STATIC_LIBRARIES := libicudata
#include $(PREBUILT_STATIC_LIBRARY)

# libicui18n
#include $(CLEAR_VARS)
#LOCAL_MODULE := libicui18n
#LOCAL_SRC_FILES := $(LIBV8_DIR)/$(LIBV8_MODE)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE)$(SUFFIX).a
#LOCAL_STATIC_LIBRARIES := libicuuc
#include $(PREBUILT_STATIC_LIBRARY)

# v8_libbase
include $(CLEAR_VARS)
LOCAL_MODULE    := libv8_libbase
LOCAL_SRC_FILES := $(LIBV8_DIR)/$(LIBV8_MODE)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE)$(SUFFIX).a
LOCAL_EXPORT_C_INCLUDES := $(TI_DIST_DIR)/android/libv8/$(V8_VERSION)/$(LIBV8_MODE)/include
include $(PREBUILT_STATIC_LIBRARY)

# base
include $(CLEAR_VARS)
LOCAL_MODULE := libv8_base
LOCAL_SRC_FILES := $(LIBV8_DIR)/$(LIBV8_MODE)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE)$(SUFFIX).a
LOCAL_EXPORT_C_INCLUDES := $(TI_DIST_DIR)/android/libv8/$(V8_VERSION)/$(LIBV8_MODE)/include
# When using V8 i18n support/ICU
#LOCAL_STATIC_LIBRARIES := libv8_libbase libicuuc libicui18n libicudata
# When setting v8_enable_i18n_support=0
LOCAL_STATIC_LIBRARIES := libv8_libbase
include $(PREBUILT_STATIC_LIBRARY)

# v8_libplatform
include $(CLEAR_VARS)
LOCAL_MODULE    := libv8_libplatform
LOCAL_SRC_FILES := $(LIBV8_DIR)/$(LIBV8_MODE)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE)$(SUFFIX).a
LOCAL_EXPORT_C_INCLUDES := $(TI_DIST_DIR)/android/libv8/$(V8_VERSION)/$(LIBV8_MODE)/include $(TI_DIST_DIR)/android/libv8/$(V8_VERSION)/$(LIBV8_MODE)
LOCAL_STATIC_LIBRARIES := libv8_libbase
include $(PREBUILT_STATIC_LIBRARY)

# v8_nosnapshot
include $(CLEAR_VARS)
LOCAL_MODULE    := libv8_nosnapshot
LOCAL_SRC_FILES := $(LIBV8_DIR)/$(LIBV8_MODE)/libs/$(SIMPLIFIED_ARCH)/$(LOCAL_MODULE)$(SUFFIX).a
LOCAL_EXPORT_C_INCLUDES := $(TI_DIST_DIR)/android/libv8/$(V8_VERSION)/$(LIBV8_MODE)/include
LOCAL_STATIC_LIBRARIES := libv8_base
include $(PREBUILT_STATIC_LIBRARY)
