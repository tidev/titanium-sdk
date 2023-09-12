/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
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

extern "C" {

JNIEXPORT jlong JNICALL Java_org_appcelerator_kroll_runtime_v8_V8Promise_nativeCreate
	(JNIEnv *env, jclass clazz)
{
	LOGD(TAG, "V8Promise::nativeCreate");
	HandleScope scope(V8Runtime::v8_isolate);
	JNIScope jniScope(env);

	Local<Context> context = V8Runtime::v8_isolate->GetCurrentContext();
	TryCatch tryCatch(V8Runtime::v8_isolate);
	MaybeLocal<Promise::Resolver> maybeResolver = v8::Promise::Resolver::New(context);
	Local<Promise::Resolver> resolver;
	if (!maybeResolver.ToLocal(&resolver)) {
 		titanium::V8Util::fatalException(V8Runtime::v8_isolate, tryCatch);
 		return 0;
 	}
	Persistent<Promise::Resolver, CopyablePersistentTraits<Promise::Resolver>> persistent(V8Runtime::v8_isolate, resolver);

	// Place the persistent into some global table with incrementing index, use the index as the "ptr" here
	// Then when we re-construct, use the ptr value as index into the table to grab the persistent!
	jlong ptr = (jlong) TypeConverter::resolverIndex; // jlong is signed 64-bit, so int64_t should match up
	TypeConverter::resolvers[TypeConverter::resolverIndex] = persistent;
	TypeConverter::resolverIndex++;
	// Java code assumes 0 is null pointer. So we need to skip it. TODO fix this so we don't need to perform this special check?
	if (TypeConverter::resolverIndex == 0) {
		TypeConverter::resolverIndex++;
	}

	return ptr;
}

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

JNIEXPORT jboolean JNICALL
Java_org_appcelerator_kroll_runtime_v8_V8Promise_nativeRelease
	(JNIEnv *env, jobject self, jlong ptr)
{
	// Release the JS function so it can be collected.
	// We guard against "bad" pointers by searching by index before releasing
	auto it = TypeConverter::resolvers.find(ptr);
	if (it != TypeConverter::resolvers.end()) {
		auto persistent = it->second;
		persistent.Reset();
		TypeConverter::resolvers.erase(it);
		return JNI_TRUE;
	}
	return JNI_FALSE;
}

} // extern "C"
