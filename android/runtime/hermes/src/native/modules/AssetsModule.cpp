/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <stdio.h>
#include <string>
#include <vector>

#include "../AndroidUtil.h"
#include "../JNIUtil.h"
#include "../JSException.h"
#include "../JSUtil.h"
#include "../TypeConverter.h"
#include "AssetsModule.h"

#define TAG "AssetsModule"

namespace titanium {

// assets.readAsset(resourceName): returns the text of an asset in the APK, or null.
static jsi::Value readAsset(jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count)
{
	if (count < 1) {
		JSException::Error(rt, "Missing required argument 'resourceName'.");
	}

	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		JSException::GetJNIEnvironmentError(rt);
	}

	jstring resourceName = TypeConverter::jsValueToJavaString(rt, env, args[0]);
	if (!resourceName) {
		JSException::Error(rt, "Required argument 'resourceName' failed to convert to string value.");
	}

	jbyteArray assetData = (jbyteArray) env->CallStaticObjectMethod(
		JNIUtil::krollAssetHelperClass,
		JNIUtil::krollAssetHelperReadAssetMethod,
		resourceName);
	env->DeleteLocalRef(resourceName);

	if (env->ExceptionCheck()) {
		LOGE(TAG, "Failed to load resource.");
		env->ExceptionDescribe();
		env->ExceptionClear();
		JSException::Error(rt, "Failed to load resource, Java exception was thrown.");
	}

	if (!assetData) {
		return jsi::Value::null();
	}

	jsi::Value resourceData = TypeConverter::javaBytesToJsString(rt, env, assetData);
	env->DeleteLocalRef(assetData);
	return resourceData;
}

// assets.readFile(filename): returns the text of a file in the file system.
static jsi::Value readFile(jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count)
{
	if (count == 0 || args[0].isNull() || args[0].isUndefined()) {
		JSException::Error(rt, "assets.readFile requires a valid filename");
	}

	std::string filename = JSUtil::toUtf8(rt, args[0]);
	FILE *file = fopen(filename.c_str(), "r");
	if (!file) {
		JSException::Error(rt, "Error opening file");
	}

	if (fseek(file, 0L, SEEK_END) != 0) {
		fclose(file);
		JSException::Error(rt, "Error reading file");
	}

	long fileLength = ftell(file);
	if (fileLength == -1) {
		fclose(file);
		JSException::Error(rt, "Error getting file length");
	}

	rewind(file);

	std::vector<char> buffer((size_t) fileLength);
	size_t readCount = fileLength > 0 ? fread(buffer.data(), (size_t) fileLength, 1, file) : 1;
	bool failed = readCount != 1 || ferror(file) != 0;
	fclose(file);

	if (failed) {
		JSException::Error(rt, "Error while reading file");
	}

	LOGD(TAG, "got file data: %ld bytes", fileLength);
	return jsi::String::createFromUtf8(rt, reinterpret_cast<const uint8_t*>(buffer.data()), buffer.size());
}

void AssetsModule::Initialize(jsi::Runtime& rt, const jsi::Object& target)
{
	JSUtil::setMethod(rt, target, "readAsset", 1, readAsset);
	JSUtil::setMethod(rt, target, "readFile", 1, readFile);
}

void AssetsModule::Dispose(jsi::Runtime& rt)
{
}

} // namespace titanium
