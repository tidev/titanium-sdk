#
# Appcelerator Titanium Mobile
# Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# Source files, and other common properties

GENERATED_DIR := $(LOCAL_PATH)/../../generated
SRC_JS_DIR := $(LOCAL_PATH)/../js

CFLAGS := $(PROXY_CFLAGS) -I$(GENERATED_DIR) -I$(LOCAL_PATH)/modules -g
ifeq ($(TI_DEBUG),1)
CFLAGS += -DTI_DEBUG=1
endif

LDLIBS := -L$(SYSROOT)/usr/lib -ldl -llog -L$(TARGET_OUT)
SRC_FILES := \
	EventEmitter.cpp \
	JavaObject.cpp \
	JNIUtil.cpp \
	KrollJavaScript.cpp \
	ModuleFactory.cpp \
	ProxyFactory.cpp \
	TypeConverter.cpp \
	V8Object.cpp \
	V8Runtime.cpp \
	V8Script.cpp \
	V8Util.cpp \
	modules/APIModule.cpp \
	modules/AssetsModule.cpp \
	modules/ScriptsModule.cpp \
	modules/TitaniumGlobal.cpp \
	$(PROXY_SOURCES)

ABS_JS_FILES := \
	$(SRC_JS_DIR)/events.js \
	$(SRC_JS_DIR)/kroll.js \
	$(SRC_JS_DIR)/module.js \
	$(SRC_JS_DIR)/titanium.js \
	$(SRC_JS_DIR)/vm.js

JS_FILES = $(subst $(SRC_JS_DIR),../js,$(ABS_JS_FILES))

$(LOCAL_PATH)/KrollJavaScript.cpp: $(GENERATED_DIR)/KrollNatives.cpp
$(LOCAL_PATH)/ModuleFactory.cpp: $(GENERATED_DIR)/ModuleInit.cpp

clean: ti-clean

ti-clean:
	rm -f $(GENERATED_DIR)/*
