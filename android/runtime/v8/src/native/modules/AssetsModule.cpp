/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "AssetsModule.h"

#include <v8.h>

#include "AndroidUtil.h"
#include "JNIUtil.h"
#include "JSException.h"
#include "TypeConverter.h"
#include "V8Util.h"

#define TAG "AssetsModule"

namespace titanium {

using namespace v8;

void AssetsModule::Initialize(Handle<Object> target)
{
	HandleScope scope;

	Local<FunctionTemplate> readResource = FunctionTemplate::New(AssetsModule::readResource);
	target->Set(String::NewSymbol("readResource"), readResource->GetFunction());
}

Handle<Value> AssetsModule::readResource(const Arguments& args)
{
	if (args.Length() < 1)
		return JSException::Error("Missing required argument 'resourceName'.");

    jstring resourceName = TypeConverter::jsStringToJavaString(args[0]->ToString());

    JNIEnv *env = JNIScope::getEnv();
	if (!env)
        return JSException::GetJNIEnvironmentError();

	jcharArray jarray = (jcharArray) env->CallStaticObjectMethod(
        JNIUtil::assetsClass,
        JNIUtil::assetsReadResourceMethod,
        resourceName);
	env->DeleteLocalRef(resourceName);

	if (env->ExceptionCheck()) {
		env->ExceptionClear();
		LOGE(TAG, "Failed to load resource.");
        return JSException::Error("Failed to load resource, Java exception was thrown.");
	}

	if (!jarray)
		return v8::Null();

	jint len = env->GetArrayLength(jarray);
	jchar *pchars = (jchar*) env->GetPrimitiveArrayCritical(jarray, 0);
	if (!pchars)
		return v8::Null();

	Local<String> resourceData = String::New(pchars, len);
	env->ReleasePrimitiveArrayCritical(jarray, pchars, 0);

	return resourceData;
}

}

