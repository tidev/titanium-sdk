
LOCAL_PATH := $(call my-dir)

include $(CLEAR_VARS)

LOCAL_MODULE := <%- moduleId %>

# Allow non-constant format strings in functions like printf(), sprintf(), etc.
LOCAL_DISABLE_FORMAT_STRING_CHECKS=true

TI_SDK_DIR = <%- tiSdkDirPath.replace(/\\/g, '\\\\') %>
LOCAL_CFLAGS := -g "-I$(TI_SDK_DIR)/native/include"
LOCAL_CFLAGS += -Wno-conversion-null -Wno-format-security -Wno-format -Wno-tautological-compare -Wno-unused-result -Wno-deprecated-register
LOCAL_LDLIBS := -L$(SYSROOT)/usr/lib -ldl -llog -L$(TARGET_OUT) "-L$(TI_SDK_DIR)/native/libs/$(TARGET_ARCH_ABI)" -lkroll-v8

ABS_SRC_FILES := \
	$(wildcard $(LOCAL_PATH)/*.cpp) \
	$(wildcard $(LOCAL_PATH)/../../../build/ti-generated/jni/*.cpp)
LOCAL_SRC_FILES := $(patsubst $(LOCAL_PATH)/%,%,$(ABS_SRC_FILES))

include $(BUILD_SHARED_LIBRARY)
