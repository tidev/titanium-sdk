/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef JSEXCEPTION_H
#define JSEXCEPTION_H

#include <jsi/jsi.h>

#include "JNIUtil.h"
#include "JSUtil.h"

namespace titanium {

// Every function here throws a C++ exception. JSI turns it into a JS exception when the
// host function returns to the engine. Release JNI local references before the call
// if the caller runs in a loop.
class JSException
{
public:
	[[noreturn]] static void Error(jsi::Runtime& rt, const char* msg)
	{
		JSUtil::throwString(rt, msg);
	}

	// Calling a constructor as a function not allowed.
	[[noreturn]] static void CalledConstructor(jsi::Runtime& rt)
	{
		JSUtil::throwString(rt, "Calling this constructor is not allowed.");
	}

	// An attempt to get the current JNI environment failed.
	[[noreturn]] static void GetJNIEnvironmentError(jsi::Runtime& rt)
	{
		JSUtil::throwString(rt, JNIENV_GET_ERROR_MSG);
	}

	// Converts the pending Java exception (or the given one) to a JS Error and throws it.
	// The pending Java exception is cleared.
	[[noreturn]] static void fromJavaException(jsi::Runtime& rt, jthrowable javaException = NULL);

	// Throws if a Java exception is pending.
	static void checkJavaException(jsi::Runtime& rt, JNIEnv* env)
	{
		if (env->ExceptionCheck()) {
			fromJavaException(rt);
		}
	}
};

} // namespace titanium

#endif
