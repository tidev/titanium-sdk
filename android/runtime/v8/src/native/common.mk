#
# Appcelerator Titanium Mobile
# Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# Source files, and other common properties

GENERATED_DIR := $(LOCAL_PATH)/../../generated
OBJ_DIR = $(THIS_DIR)/../../obj
SRC_JS_DIR := $(LOCAL_PATH)/../js
MODULES_DIR := $(LOCAL_PATH)/../../../../modules
UI_JS_DIR := $(MODULES_DIR)/ui/src/ti/modules/titanium/ui
PROPERTIES_JS_DIR := $(MODULES_DIR)/app/src/ti/modules/titanium/app/properties

CFLAGS := -I$(GENERATED_DIR) -I$(LOCAL_PATH)/modules

ifeq ($(TI_DEBUG),1)
CFLAGS += -DTI_DEBUG=1 -g
endif

ifeq ($(V8_DEBUGGER),1)
CFLAGS += -DV8_DEBUGGER=1
endif

LDLIBS := -L$(SYSROOT)/usr/lib -ldl -llog -L$(TARGET_OUT)
ABS_SRC_FILES := \
	$(wildcard $(LOCAL_PATH)/*.cpp) \
	$(wildcard $(LOCAL_PATH)/modules/*.cpp)

SRC_FILES := $(patsubst $(LOCAL_PATH)/%,%,$(ABS_SRC_FILES)) \
	$(PROXY_SOURCES)

ABS_JS_FILES := \
	$(GENERATED_DIR)/bootstrap.js \
	$(wildcard $(SRC_JS_DIR)/*.js) \
	$(wildcard $(MODULES_DIR)/*/src/js/*.js)

JS_FILES = $(subst $(SRC_JS_DIR),../js,$(ABS_JS_FILES))

$(LOCAL_PATH)/KrollBindings.cpp: $(GEN_SOURCES)

clean: ti-clean

ti-clean:
	rm -f $(GENERATED_DIR)/*
	rm -rf $(OBJ_DIR)/*
