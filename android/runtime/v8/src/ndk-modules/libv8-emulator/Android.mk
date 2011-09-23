#
# Appcelerator Titanium Mobile
# Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# libv8-emulator
LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

V8_VERSION=3.6.4
LIBV8_DIR := ../../../../../../dist/android/libv8/$(V8_VERSION)

LIBV8 := libv8-emulator

ifeq ($(NDK_DEBUG),1)
LIBV8 := libv8-emulator_g
endif

LIBV8_MODE := release

ifeq ($(NDK_DEBUG),1)
LIBV8_MODE := debug
endif

LOCAL_MODULE := libv8-emulator
LOCAL_SRC_FILES := $(LIBV8_DIR)/$(LIBV8_MODE)/lib/$(LIBV8).a
LOCAL_EXPORT_C_INCLUDES := $(TI_DIST_DIR)/android/libv8/$(V8_VERSION)/$(LIBV8_MODE)/include

include $(PREBUILT_STATIC_LIBRARY)
