/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "AssetsModule.h"

#include <stdio.h>
#include <sys/types.h>
#include <v8.h>
#include <vector>

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

	DEFINE_METHOD(target, "readResource", readResource);
	DEFINE_METHOD(target, "readFile", readFile);
}

Handle<Value> AssetsModule::readResource(const Arguments& args)
{
	if (args.Length() < 1) {
		return JSException::Error("Missing required argument 'resourceName'.");
	}

	jstring resourceName = TypeConverter::jsStringToJavaString(args[0]->ToString());

	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return JSException::GetJNIEnvironmentError();
	}

	jcharArray jarray = (jcharArray) env->CallStaticObjectMethod(
		JNIUtil::assetsClass,
		JNIUtil::assetsReadResourceMethod,
		resourceName);

	env->DeleteLocalRef(resourceName);

	if (env->ExceptionCheck()) {
		LOGE(TAG, "Failed to load resource.");
		env->ExceptionDescribe();
		env->ExceptionClear();
		return JSException::Error("Failed to load resource, Java exception was thrown.");
	}

	if (!jarray) {
		return v8::Null();
	}

	jint len = env->GetArrayLength(jarray);
	jchar *pchars = (jchar*) env->GetPrimitiveArrayCritical(jarray, 0);
	if (!pchars) {
		return v8::Null();
	}

	Local<String> resourceData = String::New(pchars, len);
	env->ReleasePrimitiveArrayCritical(jarray, pchars, 0);

	return resourceData;
}

Handle<Value> AssetsModule::readFile(const Arguments& args)
{
	HandleScope scope;

	if (args.Length() == 0 || args[0]->IsNull() || args[0]->IsUndefined()) {
		return JSException::Error("assets.readFile requires a valid filename");
	}

	String::Utf8Value filename(args[0]);

	FILE *file = fopen(*filename, "r");
	if (fseek(file, 0L, SEEK_END) != 0) {
		fclose(file);
		return JSException::Error("Error reading file");
	}

	long fileLength;
	if ((fileLength = ftell(file)) == -1) {
		fclose(file);
		return JSException::Error("Error getting file length");
	}

	rewind(file);

	char *buffer = new char[fileLength];
	while (true) {
		size_t bytesRead = fread(buffer, 1024, 1, file);
		if (ferror(file) != 0) {
			fclose(file);
			return JSException::Error("Error while reading file");
		}
		buffer += bytesRead;
		if (feof(file) != 0) {
			break;
		}
	}

	fclose(file);

	Handle<String> data = String::New(const_cast<const char *>(buffer), fileLength);
	delete buffer;

	return data;
}

}

