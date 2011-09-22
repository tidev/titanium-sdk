
GENERATED_DIR := $(LOCAL_PATH)/../../generated
SRC_JS_DIR := $(LOCAL_PATH)/../js

CFLAGS := $(PROXY_CFLAGS) -I$(GENERATED_DIR) -I$(LOCAL_PATH)/modules -g
LDLIBS := -L$(SYSROOT)/usr/lib -ldl -llog -L$(TARGET_OUT)
SRC_FILES := \
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
	modules/TitaniumModule.cpp \
	modules/APIModule.cpp \
	modules/ScriptsModule.cpp \
	$(PROXY_SOURCES)

JS_FILES := \
	$(SRC_JS_DIR)/kroll.js \
	$(SRC_JS_DIR)/titanium.js \
	$(SRC_JS_DIR)/vm.js \
	$(SRC_JS_DIR)/module.js \
	$(SRC_JS_DIR)/events.js

$(LOCAL_PATH)/KrollJavaScript.cpp: $(GENERATED_DIR)/KrollNatives.h $(GENERATED_DIR)/ModuleInit.h
