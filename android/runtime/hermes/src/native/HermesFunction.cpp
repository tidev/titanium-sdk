/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <vector>

#include "AndroidUtil.h"
#include "JNIUtil.h"
#include "JSUtil.h"
#include "Proxy.h"
#include "TiRuntime.h"
#include "TypeConverter.h"

#define TAG "HermesFunction"

using namespace titanium;

extern "C" {

/*
 * Class:     org_appcelerator_kroll_runtime_hermes_HermesFunction
 * Method:    nativeInvoke
 * Signature: (JJ[Ljava/lang/Object;)Ljava/lang/Object;
 */
JNIEXPORT jobject JNICALL Java_org_appcelerator_kroll_runtime_hermes_HermesFunction_nativeInvoke(
	JNIEnv *env, jobject caller, jlong thisPointer, jlong functionPointer, jobjectArray functionArguments)
{
	RuntimeScope scope;
	if (!scope.valid()) {
		return JNIUtil::undefinedObject;
	}
	titanium::JNIScope jniScope(env);
	jsi::Runtime& rt = TiRuntime::rt();

	try {
		// "thisPointer" is the id of the proxy that is "this" of the call.
		Proxy* proxy = thisPointer != 0 ? Proxy::fromId(thisPointer) : nullptr;
		jsi::Value thisValue = proxy ? proxy->jsObject(rt) : jsi::Value::undefined();
		if (!thisValue.isObject()) {
			LOGE(TAG, "!!!Received a bad pointer to the Proxy for 'this' in HermesFunction.nativeInvoke. Proxy may have been destroyed already. Returning undefined.");
			return JNIUtil::undefinedObject;
		}

		// "functionPointer" is the key of the JS function in the function table of the runtime.
		auto it = TiRuntime::state->functions.find(functionPointer);
		if (it == TiRuntime::state->functions.end()) {
			LOGE(TAG, "!!!Received a bad 'pointer' to the HermesFunction, unable to find an entry for it. Returning undefined.");
			return JNIUtil::undefinedObject;
		}
		// Copy the handle. The JS function can release its own table entry during the call.
		jsi::Function jsFunction = jsi::Value(rt, it->second).getObject(rt).getFunction(rt);

		std::vector<jsi::Value> jsArgs = TypeConverter::javaObjectArrayToJsArguments(rt, env, functionArguments);
		jsi::Value result = jsFunction.callWithThis(rt, thisValue.getObject(rt),
			static_cast<const jsi::Value*>(jsArgs.data()), jsArgs.size());

		bool isNew;
		return TypeConverter::jsValueToJavaObject(rt, env, result, &isNew);
	} catch (const jsi::JSError& error) {
		JSUtil::handleUncaught(rt, error);
	} catch (const std::exception& error) {
		JSUtil::reportException(error);
	}
	return JNIUtil::undefinedObject;
}

JNIEXPORT jboolean JNICALL
Java_org_appcelerator_kroll_runtime_hermes_HermesFunction_nativeRelease
	(JNIEnv *env, jobject self, jlong ptr)
{
	// Release the JS function so it can be collected.
	// Java can call this from its finalizer thread, so the runtime queues the id if needed.
	if (ptr == 0) {
		return JNI_FALSE;
	}
	TiRuntime::releaseFunction(ptr);
	return JNI_TRUE;
}

} // extern "C"
