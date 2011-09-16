/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef ANDROID_UTIL_H
#define ANDROID_UTIL_H

#include <android/log.h>

#define _LOG_LEVEL(level) ANDROID_LOG_ ## level
#define LOG(level, tag, ...) __android_log_print(_LOG_LEVEL(level), tag, __VA_ARGS__)

#define LOGV(tag, ...) LOG(VERBOSE, tag, __VA_ARGS__)
#define LOGD(tag, ...) LOG(DEBUG, tag, __VA_ARGS__)
#define LOGI(tag, ...) LOG(INFO, tag, __VA_ARGS__)
#define LOGW(tag, ...) LOG(WARN, tag, __VA_ARGS__)
#define LOGE(tag, ...) LOG(ERROR, tag, __VA_ARGS__)
#define LOGF(tag, ...) LOG(FATAL, tag, __VA_ARGS__)

#endif
