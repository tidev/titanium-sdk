# Android.mk for @PROJECT_SHORT_NAME@
LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := @PROJECT_SHORT_NAME@
LOCAL_CFLAGS := -g -I$(TI_ANDROID_NATIVE)/include
LOCAL_LDLIBS :=  -L$(SYSROOT)/usr/lib -ldl -llog -L$(TARGET_OUT) -L$(TI_ANDROID_NATIVE)/libs/$(TARGET_ARCH_ABI) -lkroll-v8

ABS_SRC_FILES := $(wildcard $(LOCAL_PATH)/*.cpp)
LOCAL_SRC_FILES := $(patsubst $(LOCAL_PATH)/%,%,$(ABS_SRC_FILES))

include $(BUILD_SHARED_LIBRARY)
