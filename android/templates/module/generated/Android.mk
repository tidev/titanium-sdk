
LOCAL_PATH := $(call my-dir)

TI_SDK_DIR = <%- tiSdkDirPath.replace(/\\/g, '\\\\') %>

# The module has one library per JS engine. An app packages the library of the engine that it uses.

# Library for the V8 engine: "lib<%- moduleId %>.so"
include $(CLEAR_VARS)

LOCAL_MODULE := <%- moduleId %>

LOCAL_DISABLE_FORMAT_STRING_CHECKS=true

LOCAL_CFLAGS := -g "-I$(TI_SDK_DIR)/native/include"
LOCAL_CFLAGS += -Wno-conversion-null -Wno-format-security -Wno-format -Wno-tautological-compare -Wno-unused-result -Wno-deprecated-register
LOCAL_CPPFLAGS := -std=c++14
LOCAL_LDLIBS := -L$(SYSROOT)/usr/lib -ldl -llog -L$(TARGET_OUT) "-L$(TI_SDK_DIR)/native/libs/$(TARGET_ARCH_ABI)" -lkroll-v8

ABS_SRC_FILES := \
	$(wildcard $(LOCAL_PATH)/*.cpp) \
	$(wildcard $(LOCAL_PATH)/../../../build/ti-generated/jni/*.cpp)
LOCAL_SRC_FILES := $(patsubst $(LOCAL_PATH)/%,%,$(ABS_SRC_FILES))

include $(BUILD_SHARED_LIBRARY)

# Library for the Hermes engine: "lib<%- moduleId %>-hermes.so"
# It contains the generated bindings only. C++ files of the module in this directory use the V8 API.
include $(CLEAR_VARS)

LOCAL_MODULE := <%- moduleId %>-hermes

LOCAL_DISABLE_FORMAT_STRING_CHECKS=true

LOCAL_CFLAGS := -g "-I$(TI_SDK_DIR)/native/hermes/include"
LOCAL_CFLAGS += -Wno-format-security -Wno-format -Wno-unused-result
LOCAL_CPPFLAGS := -std=c++20
# The Hermes runtime reports errors with C++ exceptions.
LOCAL_CPP_FEATURES := rtti exceptions
LOCAL_LDLIBS := -L$(SYSROOT)/usr/lib -ldl -llog -L$(TARGET_OUT) "-L$(TI_SDK_DIR)/native/libs/$(TARGET_ARCH_ABI)" -lkroll-hermes -ljsi

ABS_SRC_FILES := \
	$(wildcard $(LOCAL_PATH)/../../../build/ti-generated/jni-hermes/*.cpp)
LOCAL_SRC_FILES := $(patsubst $(LOCAL_PATH)/%,%,$(ABS_SRC_FILES))

include $(BUILD_SHARED_LIBRARY)
