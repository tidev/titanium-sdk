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

$(GENERATED_DIR)/KrollNatives.h: $(LOCAL_JS_FILES)
	mkdir $(GENERATED_DIR) || echo
	python $(JS2C) $(GENERATED_DIR)/KrollNatives.h $(LOCAL_JS_FILES)

GEN_BOOTSTRAP := $(THIS_DIR)/../../../../build/genBootstrap.py

$(GENERATED_DIR)/ModuleInit.h:
	mkdir $(GENERATED_DIR) || echo
	python $(GEN_BOOTSTRAP) | gperf -L C++ -Z ModuleHash -t > $(GENERATED_DIR)/ModuleInit.h
