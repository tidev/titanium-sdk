#
# Appcelerator Titanium Mobile
# Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
#
# Top level kroll-v8 runtime Makefile

# Fetch this makefile's directory path.
LOCAL_PATH := $(call my-dir)
THIS_DIR = $(LOCAL_PATH)

include $(CLEAR_VARS)

# Dynamically acquire all *.cpp files under below folders, convert to relative paths, and add them to "SRC_FILES".
# - android/runtime/v8/generated
# - android/runtime/v8/src/native
# - android/runtime/v8/src/native/modules
GENERATED_DIR := $(LOCAL_PATH)/../../generated
ABS_PROXY_SOURCES := $(wildcard $(GENERATED_DIR)/*.cpp)
ABS_SRC_FILES := \
	$(wildcard $(LOCAL_PATH)/*.cpp) \
	$(wildcard $(LOCAL_PATH)/modules/*.cpp)
SRC_FILES := \
	$(patsubst $(LOCAL_PATH)/%,%,$(ABS_SRC_FILES)) \
	$(patsubst $(GENERATED_DIR)/%,../../generated/%,$(ABS_PROXY_SOURCES))

# Set include paths.
CFLAGS := -I$(GENERATED_DIR) -I$(LOCAL_PATH)/modules -DV8_SHARED=0

# Do a debug build if requested.
ifeq ($(TI_DEBUG),1)
	CFLAGS += -DTI_DEBUG=1 -g
endif

# Disable the following compiler warnings.
CFLAGS += -Wno-conversion-null -Wno-format-security -Wno-format -Wno-tautological-compare -Wno-unused-result -Wno-deprecated-register

# Limitting the stack protector to functions with buffer larger than 4 bytes instead of the default 8
# This is neccessary due to TIMOB-24940
CFLAGS += -fstack-protector --param=ssp-buffer-size=4

# Link to the following libraries.
# -ldl references "libdl.so" library for dlopen() and dlsym() support.
# -llog references "liblog.so" library logging functions.
LDLIBS := -L$(SYSROOT)/usr/lib -ldl -llog -L$(TARGET_OUT)

# optimize output size
CFLAGS += -Os -ffunction-sections -fdata-sections
LDLIBS += -Wl,--gc-sections,--strip-all

# exclude v8 libraries
#LDLIBS += -Wl,--exclude-libs=libv8_monolith

# tune for common architectures
ifeq ($(TARGET_ARCH_ABI),arm64-v8a)
	CFLAGS += -mtune=cortex-a53
endif
ifeq ($(TARGET_ARCH_ABI),x86)
	CFLAGS += -mtune=atom
	LDLIBS += -Wl,--icf=all
endif
ifeq ($(TARGET_ARCH_ABI),armeabi-v7a)
	CFLAGS += -mtune=cortex-a7
	LDLIBS += -Wl,--icf=all
endif

# Allow non-const format strings to be used by printf(), sprintf(), etc.
# https://jira.appcelerator.org/browse/TIMOB-15263
LOCAL_DISABLE_FORMAT_STRING_CHECKS=true

LOCAL_MODULE := kroll-v8
LOCAL_CFLAGS := $(CFLAGS)
LOCAL_LDLIBS := $(LDLIBS)
LOCAL_SRC_FILES := $(SRC_FILES)

LOCAL_WHOLE_STATIC_LIBRARIES := libv8_monolith

include $(BUILD_SHARED_LIBRARY)

NDK_MODULE_PATH := $(LOCAL_PATH)/../ndk-modules
$(call import-module,libv8)
