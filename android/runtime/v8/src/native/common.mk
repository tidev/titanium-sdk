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

CFLAGS := -I$(GENERATED_DIR) -I$(LOCAL_PATH)/modules -DV8_SHARED=0

ifeq ($(TI_DEBUG),1)
CFLAGS += -DTI_DEBUG=1 -g
endif

CFLAGS += -Wno-conversion-null -Wno-format-security -Wno-format -Wno-tautological-compare -Wno-unused-result -Wno-deprecated-register
# Limitting the stack protector to functions with buffer larger than 4 bytes instead of the default 8
# This is neccessary due to TIMOB-24940
CFLAGS += -fstack-protector --param=ssp-buffer-size=4

CLEAN_GEN := rm -f $(GENERATED_DIR)/*
CLEAN_OBJ := rm -rf $(OBJ_DIR)/*

ifeq ($(OSNAME), Windows_NT)
CLEAN_GEN := if exist $(GENERATED_DIR) (rd /s /q $(subst /,\\,$(GENERATED_DIR)) && mkdir $(subst /,\\,$(GENERATED_DIR)))
CLEAN_OBJ := if exist $(OBJ_DIR) (rd /s /q $(subst /,\\,$(OBJ_DIR)) && mkdir $(subst /,\\,$(OBJ_DIR)))
endif

LDLIBS := -L$(SYSROOT)/usr/lib -ldl -llog -L$(TARGET_OUT)

# optimize output size
CFLAGS += -Os -flto -ffunction-sections -fdata-sections
LDLIBS += -Wl,--gc-sections,--strip-all

# exclude v8 libraries
LDLIBS += -Wl,--exclude-libs=libv8_libbase
LDLIBS += -Wl,--exclude-libs=libv8_libplatform
# LDLIBS += -Wl,--exclude-libs=libv8_base
LDLIBS += -Wl,--exclude-libs=libv8_nosnapshot
LDLIBS += -Wl,--exclude-libs=libv8_builtins_generators
LDLIBS += -Wl,--exclude-libs=libv8_builtins_setup

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
