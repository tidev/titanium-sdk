/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <jni.h>
#include <v8.h>

#include "JNIUtil.h"
#include "Proxy.h"
#include "TypeConverter.h"
#include "V8Runtime.h"
#include "V8Util.h"

#define TAG "V8Promise"

using namespace titanium;
using namespace v8;

#ifdef __cplusplus
extern "C" {
#endif

JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Promise_nativeResolve(
	JNIEnv *env, jobject self, jlong ptr, jobject arg)
{
	LOGD(TAG, "Promise nativeResolve");
	HandleScope scope(V8Runtime::v8_isolate);
	titanium::JNIScope jniScope(env);

	auto it = TypeConverter::resolvers.find(ptr);
	if (it == TypeConverter::resolvers.end()) {
		LOGE(TAG, "!!!Received a bad 'pointer' to the Promise::Resolver, unable to find an entry for it.");
		return;
	}

	auto persistent = TypeConverter::resolvers.at(ptr);
	auto resolver = persistent.Get(V8Runtime::v8_isolate);

	Maybe<bool> b = resolver->Resolve(V8Runtime::v8_isolate->GetCurrentContext(), TypeConverter::javaObjectToJsValue(V8Runtime::v8_isolate, arg));
	LOGD(TAG, "Promise nativeReject resolver->Resolve %s", b.FromMaybe(false) ? "true" : "false");

}

JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Promise_nativeReject(
	JNIEnv *env, jobject self, jlong ptr, jobject arg)
{
	LOGD(TAG, "Promise nativeReject");
	HandleScope scope(V8Runtime::v8_isolate);
	titanium::JNIScope jniScope(env);

	auto it = TypeConverter::resolvers.find(ptr);
	if (it == TypeConverter::resolvers.end()) {
		LOGE(TAG, "!!!Received a bad 'pointer' to the Promise::Resolver, unable to find an entry for it.");
		return;
	}

	auto persistent = TypeConverter::resolvers.at(ptr);
	auto resolver = persistent.Get(V8Runtime::v8_isolate);

	Maybe<bool> b = resolver->Reject(V8Runtime::v8_isolate->GetCurrentContext(), TypeConverter::javaObjectToJsValue(V8Runtime::v8_isolate, arg));
	LOGD(TAG, "Promise nativeReject resolver->Reject %s", b.FromMaybe(false) ? "true" : "false");
}

JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Promise_nativeRelease
	(JNIEnv *env, jobject self, jlong ptr)
{
	LOGD(TAG, "Promise nativeRelease");
	// Release the JS function so it can be collected.
	// We guard against "bad" pointers by searching by index before releasing
	auto it = TypeConverter::resolvers.find(ptr);
	if (it != TypeConverter::resolvers.end()) {
		auto persistent = it->second;
		persistent.Reset();
		TypeConverter::resolvers.erase(it);
	}
}

#ifdef __cplusplus
}
#endif
