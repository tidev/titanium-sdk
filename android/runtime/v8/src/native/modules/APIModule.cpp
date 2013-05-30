/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <android/log.h>
#include <v8.h>
#include <v8-debug.h>
#include <string.h>
#include <signal.h>
#include <unistd.h>

#include "AndroidUtil.h"

#include "APIModule.h"
#include "JNIUtil.h"
#include "V8Runtime.h"
#include "V8Util.h"
#include "org.appcelerator.kroll.KrollModule.h"

namespace titanium {

using namespace v8;

#define LOG_LEVEL_TRACE 1
#define LOG_LEVEL_DEBUG 2
#define LOG_LEVEL_INFO 3
#define LOG_LEVEL_NOTICE 4
#define LOG_LEVEL_WARN 5
#define LOG_LEVEL_ERROR 6
#define LOG_LEVEL_CRITICAL 7
#define LOG_LEVEL_FATAL 8

#define LCAT "TiAPI"

Persistent<FunctionTemplate> APIModule::constructorTemplate;


void APIModule::Initialize(Handle<Object> target)
{
	HandleScope scope;
	constructorTemplate = Persistent<FunctionTemplate>::New(FunctionTemplate::New());
	DEFINE_PROTOTYPE_METHOD(constructorTemplate, "debug", logDebug);
	DEFINE_PROTOTYPE_METHOD(constructorTemplate, "info", logInfo);
	DEFINE_PROTOTYPE_METHOD(constructorTemplate, "warn", logWarn);
	DEFINE_PROTOTYPE_METHOD(constructorTemplate, "error", logError);
	DEFINE_PROTOTYPE_METHOD(constructorTemplate, "trace", logTrace);
	DEFINE_PROTOTYPE_METHOD(constructorTemplate, "notice", logNotice);
	DEFINE_PROTOTYPE_METHOD(constructorTemplate, "critical", logCritical);
	DEFINE_PROTOTYPE_METHOD(constructorTemplate, "fatal", logFatal);
	DEFINE_PROTOTYPE_METHOD(constructorTemplate, "log", log);

	// Expose a method for terminating the application for the debugger.
	// Debugger will send an evaluation request calling this method
	// when it wants the application to terminate immediately.
	if (V8Runtime::debuggerEnabled) {
		DEFINE_PROTOTYPE_METHOD(constructorTemplate, "terminate", terminate);
		DEFINE_PROTOTYPE_METHOD(constructorTemplate, "debugBreak", debugBreak);
	}

	constructorTemplate->Inherit(KrollModule::proxyTemplate);

	target->Set(String::NewSymbol("API"), constructorTemplate->GetFunction()->NewInstance());
}


Handle<Value> APIModule::logDebug(const Arguments& args)
{
    HandleScope scope;
	String::Utf8Value message(APIModule::combineLogMessages(args));
	APIModule::logInternal(LOG_LEVEL_DEBUG, LCAT, *message);
	return scope.Close(Undefined());
}


Handle<Value> APIModule::logInfo(const Arguments& args)
{
    HandleScope scope;
	String::Utf8Value message(APIModule::combineLogMessages(args));
	APIModule::logInternal(LOG_LEVEL_INFO, LCAT, *message);
	return scope.Close(Undefined());
}


Handle<Value> APIModule::logWarn(const Arguments& args)
{
    HandleScope scope;
	String::Utf8Value message(APIModule::combineLogMessages(args));
	APIModule::logInternal(LOG_LEVEL_WARN, LCAT, *message);
	return scope.Close(Undefined());
}


Handle<Value> APIModule::logError(const Arguments& args)
{
    HandleScope scope;
	String::Utf8Value message(APIModule::combineLogMessages(args));
	APIModule::logInternal(LOG_LEVEL_ERROR, LCAT, *message);
	return scope.Close(Undefined());
}


Handle<Value> APIModule::logTrace(const Arguments& args)
{
    HandleScope scope;
	String::Utf8Value message(APIModule::combineLogMessages(args));
	APIModule::logInternal(LOG_LEVEL_TRACE, LCAT, *message);
	return scope.Close(Undefined());
}


Handle<Value> APIModule::logNotice(const Arguments& args)
{
    HandleScope scope;
	String::Utf8Value message(APIModule::combineLogMessages(args));
	APIModule::logInternal(LOG_LEVEL_NOTICE, LCAT, *message);
	return scope.Close(Undefined());
}


Handle<Value> APIModule::logCritical(const Arguments& args)
{
    HandleScope scope;
	String::Utf8Value message(APIModule::combineLogMessages(args));
	APIModule::logInternal(LOG_LEVEL_CRITICAL, LCAT, *message);
	return scope.Close(Undefined());
}


Handle<Value> APIModule::logFatal(const Arguments& args)
{
    HandleScope scope;
	String::Utf8Value message(args[0]);
	APIModule::logInternal(LOG_LEVEL_FATAL, LCAT, *message);
	return scope.Close(Undefined());
}

// Seems to be for internal use only, should be OK.
static void debugLog(int logLevel, const char* message)
{
	JNIEnv* env = JNIScope::getEnv();
	if (env == NULL) {
		LOGE(LCAT, "Failed to get JNI environment.");
		return;
	}

	jstring javaMessage = env->NewStringUTF(message);
	env->CallStaticVoidMethod(JNIUtil::krollLoggingClass,
	                          JNIUtil::krollLoggingLogWithDefaultLoggerMethod,
	                          logLevel,
	                          javaMessage);
	env->DeleteLocalRef(javaMessage);
}

void APIModule::logInternal(int logLevel, const char *messageTag, const char *message)
{

	if (V8Runtime::debuggerEnabled) {
		debugLog(logLevel, message);
		return;
	}

	if (logLevel == LOG_LEVEL_TRACE) {
		__android_log_write(ANDROID_LOG_VERBOSE, messageTag, message);
	} else if (logLevel < LOG_LEVEL_INFO) {
        if (!V8Runtime::DBG) {
            return;
        }
		__android_log_write(ANDROID_LOG_DEBUG, messageTag, message);
	} else if (logLevel < LOG_LEVEL_WARN) {
		__android_log_write(ANDROID_LOG_INFO, messageTag, message);
	} else if (logLevel == LOG_LEVEL_WARN) {
		__android_log_write(ANDROID_LOG_WARN, messageTag, message);
	} else {
		__android_log_write(ANDROID_LOG_ERROR, messageTag, message);
	}
}

Handle<Value> APIModule::log(const Arguments& args)
{
    HandleScope scope;
	if (args.Length()  == 1) {
		String::Utf8Value message(args[0]);
		APIModule::logInternal(LOG_LEVEL_INFO, LCAT, *message);
	} else {
		String::Utf8Value level(args[0]);
		String::Utf8Value message(APIModule::combineLogMessages(args, 1));

		if (strcasecmp(*level, "TRACE") == 0) {
			APIModule::logInternal(LOG_LEVEL_TRACE, LCAT, *message);
		} else if (strcasecmp(*level, "DEBUG") == 0) {
			APIModule::logInternal(LOG_LEVEL_DEBUG, LCAT, *message);
		} else if (strcasecmp(*level, "INFO") == 0) {
			APIModule::logInternal(LOG_LEVEL_INFO, LCAT, *message);
		} else if (strcasecmp(*level, "NOTICE") == 0) {
			APIModule::logInternal(LOG_LEVEL_NOTICE, LCAT, *message);
		} else if (strcasecmp(*level, "WARN") == 0) {
			APIModule::logInternal(LOG_LEVEL_WARN, LCAT, *message);
		} else if (strcasecmp(*level, "ERROR") == 0) {
			APIModule::logInternal(LOG_LEVEL_ERROR, LCAT, *message);
		} else if (strcasecmp(*level, "CRITICAL") == 0) {
			APIModule::logInternal(LOG_LEVEL_CRITICAL, LCAT, *message);
		} else if (strcasecmp(*level, "FATAL") == 0) {
			APIModule::logInternal(LOG_LEVEL_FATAL, LCAT, *message);
		} else {
			int size = strlen(*level) + strlen(*message) + 4;
			
			char *fmessage = new char[size];
			snprintf(fmessage, size, "[%s] %s", *level, *message);
	
			APIModule::logInternal(LOG_LEVEL_INFO, LCAT, fmessage);
			delete [] fmessage;
		}
	}
	
	return scope.Close(Undefined());
}
                              
Handle<Value> APIModule::combineLogMessages(const Arguments& args, int startIndex)
{
    // Unfortunately there is no really reasonable way to do this in a memory
    // and speed-efficient manner. Instead what we have is a series of string
    // object concatenations, which is a rough emulation of what the + op would
    // do in JS. Requiring the whitespace between arguments complicates matters
    // by introducing the " " token.
    static Persistent<String> space = Persistent<String>::New(String::New(" ")); // Cache for efficiency
    Local<String> message = String::Empty();
    for (int i=startIndex; i < args.Length(); i++) {
        message = String::Concat(message, String::Concat(space, args[i]->ToString()));
    }
    
    return message;
}

Handle<Value> APIModule::terminate(const Arguments& args)
{
	kill(getpid(), 9);
}

Handle<Value> APIModule::debugBreak(const Arguments& args)
{
	Debug::DebugBreak();
	return Undefined();
}

void APIModule::Dispose()
{
	constructorTemplate.Dispose();
}

}
