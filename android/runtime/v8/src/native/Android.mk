# 
# Top level v8 runtime Makefile
#

LOCAL_PATH := $(call my-dir)
LIBV8_DIR := $(LOCAL_PATH)/../../../dist/android/libv8/3.6.2
ABS_LIBV8_DIR := $(TI_DIST_DIR)/android/libv8/3.6.2

THIS_DIR := $(LOCAL_PATH)
GENERATED_DIR := $(LOCAL_PATH)/../../generated

include $(CLEAR_VARS)

SWIG_INTERFACE := mapTest
LOCAL_MODULE := kroll-v8
LOCAL_CFLAGS := -I$(LIBV8_DIR)/include -g
LOCAL_LDLIBS := -L$(SYSROOT)/usr/lib -L$(LIBV8_DIR)/lib -ldl -llog -L$(TARGET_OUT)
#LOCAL_SRC_FILES += ../../generated/jav8_wrap.cpp
LOCAL_SRC_FILES += \
	main.cpp \
	NativeMap.cpp \
	CopyMap.cpp \
	#../../generated/$(SWIG_INTERFACE)_wrap.cpp
#LOCAL_SRC_FILES += main.cpp
LOCAL_STATIC_LIBRARIES := libv8

$(GENERATED_DIR)/$(SWIG_INTERFACE)_wrap.cpp:
	mkdir -p $(GENERATED_DIR)/org/appcelerator/kroll/runtime/v8 || echo
	swig -java -c++ -package org.appcelerator.kroll.runtime.v8 -O -outdir $(GENERATED_DIR)/org/appcelerator/kroll/runtime/v8 -o $(GENERATED_DIR)/$(SWIG_INTERFACE)_wrap.cpp -oh $(GENERATED_DIR)/$(SWIG_INTERFACE)_wrap.h -I$(ABS_LIBV8_DIR)/include $(THIS_DIR)/$(SWIG_INTERFACE).i

include $(BUILD_SHARED_LIBRARY)

NDK_MODULE_PATH := $(LOCAL_PATH)/../ndk-modules
$(call import-module,libv8)
