/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>

#include "JSException.h"
#include "TypeConverter.h"

namespace titanium {

void JSException::fromJavaException(jsi::Runtime& rt, jthrowable javaException)
{
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		GetJNIEnvironmentError(rt);
	}

	bool deleteRef = false;
	if (!javaException) {
		javaException = env->ExceptionOccurred();
		deleteRef = true;
	}
	env->ExceptionClear();

	if (!javaException) {
		JSUtil::throwString(rt, "Unknown Java Exception occurred");
	}

	jsi::Object error = TypeConverter::javaThrowableToJSError(rt, env, javaException);
	if (deleteRef) {
		env->DeleteLocalRef(javaException);
	}

	throw jsi::JSError(rt, jsi::Value(std::move(error)));
}

} // namespace titanium
