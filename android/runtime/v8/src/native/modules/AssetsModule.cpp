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

	DEFINE_METHOD(target, "readAsset", readAsset);
	DEFINE_METHOD(target, "readFile", readFile);
}

Handle<Value> AssetsModule::readAsset(const Arguments& args)
{
	if (args.Length() < 1) {
		return JSException::Error("Missing required argument 'resourceName'.");
	}

	jstring resourceName = TypeConverter::jsStringToJavaString(args[0]->ToString());

	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return JSException::GetJNIEnvironmentError();
	}

	jstring assetData = (jstring) env->CallStaticObjectMethod(
		JNIUtil::krollAssetHelperClass,
		JNIUtil::krollAssetHelperReadAssetMethod,
		resourceName);

	env->DeleteLocalRef(resourceName);

	if (env->ExceptionCheck()) {
		LOGE(TAG, "Failed to load resource.");
		env->ExceptionDescribe();
		env->ExceptionClear();
		return JSException::Error("Failed to load resource, Java exception was thrown.");
	}

	if (!assetData) {
		return v8::Null();
	}

	jint len = env->GetStringLength(assetData);
	const jchar *assetChars = env->GetStringChars(assetData, NULL);
	if (!assetChars) {
		return v8::Null();
	}

	Local<String> resourceData = String::New(assetChars, len);
	env->ReleaseStringChars(assetData, assetChars);
	env->DeleteLocalRef(assetData);

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

	if (!file) {
		return JSException::Error("Error opening file");
	}

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

	fread(buffer, fileLength, 1, file);
	fclose(file);

	if (ferror(file) != 0) {
		return JSException::Error("Error while reading file");
	}

	LOGD(TAG, "got file data: %d bytes", fileLength);

	Handle<String> data = String::New(const_cast<const char *>(buffer), fileLength);
	delete[] buffer;

	return data;
}

}

