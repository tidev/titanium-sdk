#
# Appcelerator Titanium Mobile
# Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# 
# Top level kroll-v8 runtime Makefile

LOCAL_PATH := $(call my-dir)

THIS_DIR := $(LOCAL_PATH)
GENERATED_DIR := $(LOCAL_PATH)/../../generated
SRC_JS_DIR := $(LOCAL_PATH)/../js

include $(CLEAR_VARS)
include $(LOCAL_PATH)/genSources.mk

LOCAL_MODULE := kroll-v8
LOCAL_CFLAGS := $(PROXY_CFLAGS) -I$(GENERATED_DIR) -I$(LOCAL_PATH)/modules -g
LOCAL_LDLIBS := -L$(SYSROOT)/usr/lib -ldl -llog -L$(TARGET_OUT)
LOCAL_SRC_FILES += \
	../../generated/KrollNatives.h \
	../../generated/ModuleInit.h \
	Assets.cpp \
	EventEmitter.cpp \
	JNIUtil.cpp \
	KrollJavaScript.cpp \
	KrollProxy.cpp \
	ProxyFactory.cpp \
	TypeConverter.cpp \
	V8Object.cpp \
	V8Runtime.cpp \
	V8Util.cpp \
	modules/APIModule.cpp \
	modules/ScriptsModule.cpp \
	$(PROXY_SOURCES)

LOCAL_JS_FILES := \
	$(SRC_JS_DIR)/kroll.js \
	$(SRC_JS_DIR)/events.js

$(LOCAL_PATH)/KrollJavaScript.cpp: $(GENERATED_DIR)/KrollNatives.h $(GENERATED_DIR)/ModuleInit.h

LOCAL_STATIC_LIBRARIES := libv8

include $(BUILD_SHARED_LIBRARY)

NDK_MODULE_PATH := $(LOCAL_PATH)/../ndk-modules
$(call import-module,libv8)
