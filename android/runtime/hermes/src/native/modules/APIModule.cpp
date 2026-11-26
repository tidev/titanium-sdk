/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <android/log.h>
#include <cstring>
#include <signal.h>
#include <string>
#include <unistd.h>

#include "../AndroidUtil.h"
#include "../JNIUtil.h"
#include "../JSUtil.h"
#include "../Proxy.h"
#include "../TiRuntime.h"
#include "APIModule.h"

// Generated binding of the Java class that Ti.API inherits from.
#include "org.appcelerator.kroll.KrollModule.h"

namespace titanium {

#define LOG_LEVEL_TRACE 1
#define LOG_LEVEL_DEBUG 2
#define LOG_LEVEL_INFO 3
#define LOG_LEVEL_NOTICE 4
#define LOG_LEVEL_WARN 5
#define LOG_LEVEL_ERROR 6
#define LOG_LEVEL_CRITICAL 7
#define LOG_LEVEL_FATAL 8

#define LCAT "TiAPI"

// Sends the message to the debugger console through Java.
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

static void logInternal(int logLevel, const char *messageTag, const char *message)
{
	if (TiRuntime::debuggerEnabled) {
		debugLog(logLevel, message);
		return;
	}

	if (logLevel == LOG_LEVEL_TRACE) {
		__android_log_write(ANDROID_LOG_VERBOSE, messageTag, message);
	} else if (logLevel < LOG_LEVEL_INFO) {
		if (!TiRuntime::DBG) {
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

// Joins the arguments with a space before each one, like the V8 runtime does.
static std::string combineLogMessages(jsi::Runtime& rt, const jsi::Value* args, size_t count, size_t startIndex = 0)
{
	std::string message;
	for (size_t i = startIndex; i < count; i++) {
		message += " ";
		message += JSUtil::toUtf8(rt, args[i]);
	}
	return message;
}

template <int LEVEL>
static jsi::Value logAtLevel(jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count)
{
	std::string message = combineLogMessages(rt, args, count);
	if (LEVEL == LOG_LEVEL_INFO) {
		// Logcat cuts a line after about 4 KB. Split a long message.
		const size_t maxChunk = 4050;
		for (size_t i = 0, len = message.length(); i < len; i += maxChunk) {
			logInternal(LEVEL, LCAT, message.substr(i, maxChunk).c_str());
		}
		return jsi::Value::undefined();
	}
	logInternal(LEVEL, LCAT, message.c_str());
	return jsi::Value::undefined();
}

static jsi::Value logFatal(jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count)
{
	std::string message = count > 0 ? JSUtil::toUtf8(rt, args[0]) : std::string();
	logInternal(LOG_LEVEL_FATAL, LCAT, message.c_str());
	return jsi::Value::undefined();
}

// Ti.API.log(message) or Ti.API.log(level, message...)
static jsi::Value log(jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count)
{
	if (count == 0) {
		return jsi::Value::undefined();
	}
	if (count == 1) {
		logInternal(LOG_LEVEL_INFO, LCAT, JSUtil::toUtf8(rt, args[0]).c_str());
		return jsi::Value::undefined();
	}

	std::string level = JSUtil::toUtf8(rt, args[0]);
	std::string message = combineLogMessages(rt, args, count, 1);

	static const struct {
		const char* name;
		int level;
	} levels[] = {
		{ "TRACE", LOG_LEVEL_TRACE }, { "DEBUG", LOG_LEVEL_DEBUG }, { "INFO", LOG_LEVEL_INFO },
		{ "NOTICE", LOG_LEVEL_NOTICE }, { "WARN", LOG_LEVEL_WARN }, { "ERROR", LOG_LEVEL_ERROR },
		{ "CRITICAL", LOG_LEVEL_CRITICAL }, { "FATAL", LOG_LEVEL_FATAL }
	};
	for (const auto& entry : levels) {
		if (strcasecmp(level.c_str(), entry.name) == 0) {
			logInternal(entry.level, LCAT, message.c_str());
			return jsi::Value::undefined();
		}
	}

	std::string custom = "[" + level + "] " + message;
	logInternal(LOG_LEVEL_INFO, LCAT, custom.c_str());
	return jsi::Value::undefined();
}

static jsi::Value getApiName(jsi::Runtime& rt, const jsi::Value&, const jsi::Value*, size_t)
{
	return jsi::String::createFromAscii(rt, "Ti.API");
}

static jsi::Value undefined(jsi::Runtime&, const jsi::Value&, const jsi::Value*, size_t)
{
	return jsi::Value::undefined();
}

static jsi::Value terminate(jsi::Runtime&, const jsi::Value&, const jsi::Value*, size_t)
{
	kill(getpid(), 9);
	return jsi::Value::undefined();
}

void APIModule::Initialize(jsi::Runtime& rt, const jsi::Object& target)
{
	RuntimeState& state = *TiRuntime::state;

	// Ti.API has no Java object. It is a JS class that inherits from KrollModule.
	jsi::Function init = JSUtil::hostFunction(rt, "API", 2, undefined);
	jsi::Function constructor = state.makeConstructor.call(rt, jsi::String::createFromAscii(rt, "API"), init)
		.getObject(rt).getFunction(rt);
	jsi::Object prototype = state.setupPrototype
		.call(rt, constructor, Proxy::getConstructor(rt, KrollModule::getProxyClass())).getObject(rt);

	JSUtil::setMethod(rt, prototype, "debug", 1, logAtLevel<LOG_LEVEL_DEBUG>);
	JSUtil::setMethod(rt, prototype, "info", 1, logAtLevel<LOG_LEVEL_INFO>);
	JSUtil::setMethod(rt, prototype, "warn", 1, logAtLevel<LOG_LEVEL_WARN>);
	JSUtil::setMethod(rt, prototype, "error", 1, logAtLevel<LOG_LEVEL_ERROR>);
	JSUtil::setMethod(rt, prototype, "trace", 1, logAtLevel<LOG_LEVEL_TRACE>);
	JSUtil::setMethod(rt, prototype, "notice", 1, logAtLevel<LOG_LEVEL_NOTICE>);
	JSUtil::setMethod(rt, prototype, "critical", 1, logAtLevel<LOG_LEVEL_CRITICAL>);
	JSUtil::setMethod(rt, prototype, "fatal", 1, logFatal);
	JSUtil::setMethod(rt, prototype, "log", 2, log);
	JSUtil::setMethod(rt, prototype, "getApiName", 0, getApiName);
	JSUtil::setMethod(rt, prototype, "getBubbleParent", 0, undefined);
	JSUtil::setMethod(rt, prototype, "getLifecycleContainer", 0, undefined);
	JSUtil::setMethod(rt, prototype, "setBubbleParent", 1, undefined);
	JSUtil::setMethod(rt, prototype, "setLifecycleContainer", 1, undefined);

	state.defineNativeAccessor.call(rt, prototype, jsi::String::createFromAscii(rt, "apiName"),
		JSUtil::hostFunction(rt, "apiName", 0, getApiName));
	state.defineNativeAccessor.call(rt, prototype, jsi::String::createFromAscii(rt, "bubbleParent"),
		JSUtil::hostFunction(rt, "bubbleParent", 0, undefined));
	state.defineNativeAccessor.call(rt, prototype, jsi::String::createFromAscii(rt, "lifecycleContainer"),
		JSUtil::hostFunction(rt, "lifecycleContainer", 0, undefined));

	if (TiRuntime::debuggerEnabled) {
		JSUtil::setMethod(rt, prototype, "terminate", 0, terminate);
		// TODO(hermes): add "debugBreak" with the Hermes debugger in Phase 7.
	}

	target.setProperty(rt, "API", constructor.callAsConstructor(rt));
}

void APIModule::Dispose(jsi::Runtime& rt)
{
}

} // namespace titanium
