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

TOOLS_DIR := $(THIS_DIR)/../../tools
JS2C := $(TOOLS_DIR)/js2c.py

GEN_BOOTSTRAP := $(THIS_DIR)/../../tools/genBootstrap.py

ABS_PROXY_SOURCES := $(wildcard $(GENERATED_DIR)/org.*.cpp) \
	$(wildcard $(GENERATED_DIR)/ti.*.cpp)

PROXY_SOURCES := $(patsubst $(GENERATED_DIR)/%,../../generated/%,$(ABS_PROXY_SOURCES))

GEN_SOURCES := \
	$(GENERATED_DIR)/KrollJS.cpp \
	$(GENERATED_DIR)/KrollGeneratedBindings.cpp \
	$(GENERATED_DIR)/KrollNativeBindings.cpp

JNI_PREFIX := $(GENERATED_DIR)/org_appcelerator_kroll_runtime_v8

DIST_DIR := $(THIS_DIR)/../../../../../dist/android
$(THIS_DIR)/V8Runtime.cpp: $(JNI_PREFIX)_V8Runtime.h
$(THIS_DIR)/V8Object.cpp: $(JNI_PREFIX)_V8Object.h

ti-generated-dir:
	@mkdir -p $(GENERATED_DIR) 2>/dev/null

ifeq ($(PYTHON),)
PYTHON := python
endif

$(GENERATED_DIR)/KrollJS.cpp: ti-generated-dir $(ABS_JS_FILES) $(GENERATED_DIR)/KrollGeneratedBindings.cpp
	$(PYTHON) $(JS2C) $(GENERATED_DIR)/KrollJS.cpp $(ABS_JS_FILES)

$(GENERATED_DIR)/KrollGeneratedBindings.cpp: ti-generated-dir $(ABS_PROXY_SOURCES)
	$(PYTHON) $(GEN_BOOTSTRAP)
	gperf -L C++ -E -t $(GENERATED_DIR)/KrollGeneratedBindings.gperf > $(GENERATED_DIR)/KrollGeneratedBindings.cpp

$(GENERATED_DIR)/KrollNativeBindings.cpp: ti-generated-dir $(THIS_DIR)/KrollNativeBindings.gperf
	gperf -L C++ -E -t $(THIS_DIR)/KrollNativeBindings.gperf > $(GENERATED_DIR)/KrollNativeBindings.cpp

JAVAH := javah
$(JNI_PREFIX)%.h:
	$(JAVAH) -classpath $(DIST_DIR)/kroll-v8.jar -d $(GENERATED_DIR) $(subst .h,,$(subst _,.,$(patsubst $(GENERATED_DIR)/%,%,$(@F))))
