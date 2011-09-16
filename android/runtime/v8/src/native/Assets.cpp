/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <v8.h>

#include "JNIUtil.h"
#include "TypeConverter.h"

static jobject gAssets;
static jmethodID gReadResourceMethod;

using namespace titanium;

/*
 * Class:     org_appcelerator_kroll_runtime_Assets
 * Method:    assign
 * Signature: (Lorg/appcelerator/kroll/runtime/Assets;)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_Assets_assign
(JNIEnv *env, jclass clazz, jobject assets)
{
	if (gAssets) {
		env->DeleteGlobalRef(gAssets);
		gAssets = 0;
	}
	if (assets) {
		gAssets = env->NewGlobalRef(assets);
		gReadResourceMethod = env->GetMethodID(clazz, "readResource", "(Ljava/lang/String;)[C");
	}
}

namespace assets {

v8::Handle<v8::Primitive> readResource(v8::Handle<v8::String> path)
{
	JNIEnv *env = JNIUtil::getJNIEnv();
	if (!gAssets || !env) {
		return v8::Null();
	}
	jstring jpath = TypeConverter::jsStringToJavaString(path);
	jcharArray jarray = (jcharArray) env->CallObjectMethod(gAssets, gReadResourceMethod, jpath);
	jthrowable exc = env->ExceptionOccurred();
	if (exc) {
		env->ExceptionClear();
		// TODO: throw JS exception
		return v8::Null();
	}
	if (!jarray) {
		return v8::Null();
	}
	jint len = env->GetArrayLength(jarray);
	jchar *pchars = (jchar*) env->GetPrimitiveArrayCritical(jarray, 0);
	if (!pchars) {
		return v8::Null();
	}
	v8::Handle<v8::String> jsString = v8::String::New(pchars, len);
	env->ReleasePrimitiveArrayCritical(jarray, pchars, 0);
	return jsString;
}

}
