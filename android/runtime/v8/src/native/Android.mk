#
# Appcelerator Titanium Mobile
# Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# 
# Top level kroll-v8 runtime Makefile

LOCAL_PATH := $(call my-dir)
THIS_DIR = $(LOCAL_PATH)

include $(LOCAL_PATH)/genSources.mk
include $(LOCAL_PATH)/common.mk

ifeq ($(TARGET_DEVICE),emulator)
include $(THIS_DIR)/emulator.mk
else
include $(THIS_DIR)/device.mk
endif