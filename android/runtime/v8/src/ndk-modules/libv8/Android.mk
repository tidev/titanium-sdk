LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

V8_VERSION=3.6.2
LIBV8_DIR := ../../../../../../dist/android/libv8/$(V8_VERSION)

LOCAL_MODULE := libv8
LOCAL_SRC_FILES := $(LIBV8_DIR)/lib/libv8.a
LOCAL_EXPORT_C_INCLUDES := $(TI_DIST_DIR)/android/libv8/$(V8_VERSION)/include

include $(PREBUILT_STATIC_LIBRARY)
