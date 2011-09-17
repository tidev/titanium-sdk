/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <android/log.h>
#include <v8.h>
#include <string.h>

#include "AndroidUtil.h"

#include "APIModule.h"

using namespace titanium;


#define LOG_LEVEL_TRACE 1
#define LOG_LEVEL_DEBUG 2
#define LOG_LEVEL_INFO 3
#define LOG_LEVEL_NOTICE 4
#define LOG_LEVEL_WARN 5
#define LOG_LEVEL_ERROR 6
#define LOG_LEVEL_CRITICAL 7
#define LOG_LEVEL_FATAL 8

#define LCAT "TiAPI"


v8::Handle<v8::Object> APIModule::init()
{
	v8::Handle<v8::FunctionTemplate> apiModule = v8::FunctionTemplate::New();
	v8::Handle<v8::ObjectTemplate> apiModulePrototype = apiModule->PrototypeTemplate();
	apiModulePrototype->Set(v8::String::New("debug"), v8::FunctionTemplate::New(logDebug)->GetFunction());
	apiModulePrototype->Set(v8::String::New("info"), v8::FunctionTemplate::New(logInfo)->GetFunction());
	apiModulePrototype->Set(v8::String::New("warn"), v8::FunctionTemplate::New(logWarn)->GetFunction());
	apiModulePrototype->Set(v8::String::New("error"), v8::FunctionTemplate::New(logError)->GetFunction());
	apiModulePrototype->Set(v8::String::New("trace"), v8::FunctionTemplate::New(logTrace)->GetFunction());
	apiModulePrototype->Set(v8::String::New("notice"), v8::FunctionTemplate::New(logNotice)->GetFunction());
	apiModulePrototype->Set(v8::String::New("critical"), v8::FunctionTemplate::New(logCritical)->GetFunction());
	apiModulePrototype->Set(v8::String::New("fatal"), v8::FunctionTemplate::New(logFatal)->GetFunction());
	apiModulePrototype->Set(v8::String::New("log"), v8::FunctionTemplate::New(log)->GetFunction());

	v8::Handle<v8::Value> arguments[] = {};

	return apiModule->GetFunction()->NewInstance(0, arguments);
}


v8::Handle<v8::Value> APIModule::logDebug(const v8::Arguments& args)
{
	v8::String::Utf8Value message(args[0]);
	APIModule::logInternal(LOG_LEVEL_DEBUG, LCAT, *message);
	return v8::Undefined();
}


v8::Handle<v8::Value> APIModule::logInfo(const v8::Arguments& args)
{
	v8::String::Utf8Value message(args[0]);
	APIModule::logInternal(LOG_LEVEL_INFO, LCAT, *message);
	return v8::Undefined();
}


v8::Handle<v8::Value> APIModule::logWarn(const v8::Arguments& args)
{
	v8::String::Utf8Value message(args[0]);
	APIModule::logInternal(LOG_LEVEL_WARN, LCAT, *message);
	return v8::Undefined();
}


v8::Handle<v8::Value> APIModule::logError(const v8::Arguments& args)
{
	v8::String::Utf8Value message(args[0]);
	APIModule::logInternal(LOG_LEVEL_ERROR, LCAT, *message);
	return v8::Undefined();
}


v8::Handle<v8::Value> APIModule::logTrace(const v8::Arguments& args)
{
	v8::String::Utf8Value message(args[0]);
	APIModule::logInternal(LOG_LEVEL_TRACE, LCAT, *message);
	return v8::Undefined();
}


v8::Handle<v8::Value> APIModule::logNotice(const v8::Arguments& args)
{
	v8::String::Utf8Value message(args[0]);
	APIModule::logInternal(LOG_LEVEL_NOTICE, LCAT, *message);
	return v8::Undefined();
}


v8::Handle<v8::Value> APIModule::logCritical(const v8::Arguments& args)
{
	v8::String::Utf8Value message(args[0]);
	APIModule::logInternal(LOG_LEVEL_CRITICAL, LCAT, *message);
	return v8::Undefined();
}


v8::Handle<v8::Value> APIModule::logFatal(const v8::Arguments& args)
{
	v8::String::Utf8Value message(args[0]);
	APIModule::logInternal(LOG_LEVEL_FATAL, LCAT, *message);
	return v8::Undefined();
}


void APIModule::logInternal(int logLevel, const char *messageTag, const char *message)
{
	if (logLevel == LOG_LEVEL_TRACE) {
		LOGV(messageTag, message);
	} else if (logLevel < LOG_LEVEL_INFO) {
		LOGD(messageTag, message);
	} else if (logLevel < LOG_LEVEL_WARN) {
		LOGI(messageTag, message);
	} else if (logLevel == LOG_LEVEL_WARN) {
		LOGW(messageTag, message);
	} else {
		LOGE(messageTag, message);
	}
}


v8::Handle<v8::Value> APIModule::log(const v8::Arguments& args)
{
	v8::String::Utf8Value level(args[0]);
	v8::String::Utf8Value message(args[1]);

	if (strcasecmp(*level, "TRACE")) {
		APIModule::logInternal(LOG_LEVEL_TRACE, LCAT, *message);
	} else if (strcasecmp(*level, "DEBUG")) {
		APIModule::logInternal(LOG_LEVEL_DEBUG, LCAT, *message);
	} else if (strcasecmp(*level, "INFO")) {
		APIModule::logInternal(LOG_LEVEL_INFO, LCAT, *message);
	} else if (strcasecmp(*level, "NOTICE")) {
		APIModule::logInternal(LOG_LEVEL_NOTICE, LCAT, *message);
	} else if (strcasecmp(*level, "WARN")) {
		APIModule::logInternal(LOG_LEVEL_WARN, LCAT, *message);
	} else if (strcasecmp(*level, "ERROR")) {
		APIModule::logInternal(LOG_LEVEL_ERROR, LCAT, *message);
	} else if (strcasecmp(*level, "CRITICAL")) {
		APIModule::logInternal(LOG_LEVEL_CRITICAL, LCAT, *message);
	} else if (strcasecmp(*level, "FATAL")) {
		APIModule::logInternal(LOG_LEVEL_FATAL, LCAT, *message);
	} else {
		APIModule::logInternal(LOG_LEVEL_INFO, LCAT, *message);
	}

	return v8::Undefined();
}


