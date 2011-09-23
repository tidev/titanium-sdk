#
# Appcelerator Titanium Mobile
# Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# Targets and variables for generated sources

GENERATED_DIR := $(LOCAL_PATH)/../../generated

THIS_DIR := $(LOCAL_PATH)
ANDROID_DIR := ../../../..
ABS_ANDROID_DIR := $(LOCAL_PATH)/$(ANDROID_DIR)

TI_APT_GEN := $(ABS_ANDROID_DIR)/titanium/.apt_generated
ABS_PROXY_SOURCES := $(wildcard $(ABS_ANDROID_DIR)/modules/*/.apt_generated/*.cpp) \
	$(wildcard $(TI_APT_GEN)/*.cpp)

PROXY_SOURCES := $(patsubst $(ABS_ANDROID_DIR)/%,$(ANDROID_DIR)/%,$(ABS_PROXY_SOURCES))

PROXY_GEN_DIRS := $(wildcard $(ABS_ANDROID_DIR)/modules/*/.apt_generated) \
	$(ABS_ANDROID_DIR)/titanium/.apt_generated
PROXY_CFLAGS := $(addprefix -I,$(PROXY_GEN_DIRS))

TOOLS_DIR := $(THIS_DIR)/../../tools
JS2C := $(TOOLS_DIR)/js2c.py

$(GENERATED_DIR)/KrollNatives.cpp: $(ABS_JS_FILES)
	@mkdir $(GENERATED_DIR) 2>/dev/null || echo
	python $(JS2C) $(GENERATED_DIR)/KrollNatives.cpp $(ABS_JS_FILES)

GEN_BOOTSTRAP := $(THIS_DIR)/../../../../build/genBootstrap.py

$(GENERATED_DIR)/ModuleInit.cpp:
	@mkdir $(GENERATED_DIR) 2>/dev/null || echo
	python $(GEN_BOOTSTRAP) | gperf -L C++ -Z ModuleHash -t > $(GENERATED_DIR)/ModuleInit.cpp
