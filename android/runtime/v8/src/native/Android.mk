# 
# Top level v8 runtime Makefile
#

LOCAL_PATH := $(call my-dir)
LIBV8_DIR := $(LOCAL_PATH)/../../../dist/android/libv8/3.6.2

include $(CLEAR_VARS)

LOCAL_MODULE := kroll-v8
LOCAL_CFLAGS := -I$(LIBV8_DIR)/include -g
LOCAL_LDLIBS := -L$(SYSROOT)/usr/lib -L$(LIBV8_DIR)/lib -ldl -llog -L$(TARGET_OUT)
LOCAL_SRC_FILES += FunctionTest.cpp
LOCAL_STATIC_LIBRARIES := libv8

$(TARGET_OUT)/libv8.a:
	cp $(LIBV8_DIR)/v8/lib/libv8.a $(TARGET_OUT)

include $(BUILD_SHARED_LIBRARY)

NDK_MODULE_PATH := $(LOCAL_PATH)/../ndk-modules
$(call import-module,libv8)
