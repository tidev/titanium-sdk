/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>

#include "AndroidUtil.h"
#include "JNIUtil.h"
#include "JSUtil.h"
#include "TiRuntime.h"
#include "TypeConverter.h"

#define TAG "HermesPromise"

using namespace titanium;

// Settles the promise with the given table key. "resolve" selects the function to call.
static void settle(JNIEnv* env, jlong ptr, jobject arg, bool resolve)
{
	RuntimeScope scope;
	if (!scope.valid()) {
		return;
	}
	titanium::JNIScope jniScope(env);
	jsi::Runtime& rt = TiRuntime::rt();

	auto it = TiRuntime::state->resolvers.find(ptr);
	if (it == TiRuntime::state->resolvers.end()) {
		LOGE(TAG, "!!!Received a bad 'pointer' to the promise, unable to find an entry for it.");
		return;
	}
	std::optional<jsi::Function>& function = resolve ? it->second.resolve : it->second.reject;
	if (!function) {
		LOGW(TAG, "Java cannot settle a promise that JS code created.");
		return;
	}

	try {
		function->call(rt, TypeConverter::javaObjectToJsValue(rt, env, arg));
	} catch (const jsi::JSError& error) {
		JSUtil::handleUncaught(rt, error);
	} catch (const std::exception& error) {
		JSUtil::reportException(error);
	}
}

extern "C" {

JNIEXPORT jlong JNICALL Java_org_appcelerator_kroll_runtime_hermes_HermesPromise_nativeCreate
	(JNIEnv *env, jclass clazz)
{
	LOGD(TAG, "HermesPromise::nativeCreate");
	RuntimeScope scope;
	if (!scope.valid()) {
		return 0;
	}
	JNIScope jniScope(env);
	jsi::Runtime& rt = TiRuntime::rt();

	try {
		// JSI has no promise resolver type. A JS helper makes the promise and hands out
		// its resolve and reject functions.
		jsi::Object deferred = TiRuntime::state->makeDeferred.call(rt).getObject(rt);
		Deferred entry{
			deferred.getPropertyAsObject(rt, "promise"),
			deferred.getPropertyAsFunction(rt, "resolve"),
			deferred.getPropertyAsFunction(rt, "reject")
		};
		int64_t id = TiRuntime::nextHandleId();
		TiRuntime::state->resolvers.emplace(id, std::move(entry));
		return (jlong) id;
	} catch (const jsi::JSError& error) {
		JSUtil::reportException(rt, error);
	} catch (const std::exception& error) {
		JSUtil::reportException(error);
	}
	return 0;
}

JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_hermes_HermesPromise_nativeResolve(
	JNIEnv *env, jobject self, jlong ptr, jobject arg)
{
	LOGD(TAG, "Promise nativeResolve");
	settle(env, ptr, arg, true);
}

JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_hermes_HermesPromise_nativeReject(
	JNIEnv *env, jobject self, jlong ptr, jobject arg)
{
	LOGD(TAG, "Promise nativeReject");
	settle(env, ptr, arg, false);
}

JNIEXPORT jboolean JNICALL
Java_org_appcelerator_kroll_runtime_hermes_HermesPromise_nativeRelease
	(JNIEnv *env, jobject self, jlong ptr)
{
	// Release the promise so it can be collected.
	// Java can call this from its finalizer thread, so the runtime queues the id if needed.
	if (ptr == 0) {
		return JNI_FALSE;
	}
	TiRuntime::releaseResolver(ptr);
	return JNI_TRUE;
}

} // extern "C"
