#
# Appcelerator Titanium Mobile
# Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# Source files, and other common properties

GENERATED_DIR := $(LOCAL_PATH)/../../generated
OBJ_DIR = $(THIS_DIR)/../../obj
SRC_JS_DIR := $(LOCAL_PATH)/../../../common/src/js
MODULES_DIR := $(LOCAL_PATH)/../../../../modules
UI_JS_DIR := $(MODULES_DIR)/ui/src/ti/modules/titanium/ui
PROPERTIES_JS_DIR := $(MODULES_DIR)/app/src/ti/modules/titanium/app/properties

CFLAGS := -I$(GENERATED_DIR) -I$(LOCAL_PATH)/modules -DV8_SHARED=1

ifeq ($(TI_DEBUG),1)
CFLAGS += -DTI_DEBUG=1 -g
endif

# Several places in generated code we set some jvalues to NULL and
# since NDK r8b we'd get warnings about each one.
CFLAGS += -Wno-conversion-null

# cf https://groups.google.com/forum/?fromgroups=#!topic/android-ndk/Q8ajOD37LR0
CFLAGS += -Wno-psabi

CLEAN_GEN := rm -f $(GENERATED_DIR)/*
CLEAN_OBJ := rm -rf $(OBJ_DIR)/*

ifeq ($(OSNAME), Windows_NT)
CLEAN_GEN := if exist $(GENERATED_DIR) (rd /s /q $(subst /,\\,$(GENERATED_DIR)) && mkdir $(subst /,\\,$(GENERATED_DIR)))
CLEAN_OBJ := if exist $(OBJ_DIR) (rd /s /q $(subst /,\\,$(OBJ_DIR)) && mkdir $(subst /,\\,$(OBJ_DIR)))
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
	$(CLEAN_GEN)
	$(CLEAN_OBJ)
