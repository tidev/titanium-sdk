/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <string>
#include <vector>

#include "AndroidUtil.h"
#include "JNIUtil.h"
#include "JSException.h"
#include "JSUtil.h"
#include "Proxy.h"
#include "ProxyFactory.h"
#include "TiRuntime.h"
#include "TypeConverter.h"

#define TAG "HermesObject"

using namespace titanium;

// Finds the JS object for a HermesObject. "id" is the value of its "ptr" field.
// If the native proxy is gone, the function makes a new JS object for the Java proxy.
static jsi::Value jsObjectFor(jsi::Runtime& rt, JNIEnv* env, jlong id, jobject javaKrollObject)
{
	Proxy* proxy = id != 0 ? Proxy::fromId(id) : nullptr;
	if (proxy) {
		jsi::Value jsObject = proxy->jsObject(rt);
		if (jsObject.isObject()) {
			return jsObject;
		}
	}

	LOGD(TAG, "The Java object has no JS object. Attempting to revive it from the Java object.");
	jobject proxySupportField = env->GetObjectField(javaKrollObject, JNIUtil::krollObjectProxySupportField);
	if (!proxySupportField) {
		return jsi::Value::undefined();
	}
	static jmethodID getMethodID = NULL;
	if (!getMethodID) {
		jclass weakReferenceClass = env->FindClass("java/lang/ref/WeakReference");
		getMethodID = env->GetMethodID(weakReferenceClass, "get", "()Ljava/lang/Object;");
		env->DeleteLocalRef(weakReferenceClass);
	}
	jobject proxySupport = env->CallObjectMethod(proxySupportField, getMethodID);
	env->DeleteLocalRef(proxySupportField);
	if (!proxySupport) {
		return jsi::Value::undefined();
	}
	jsi::Value result = TypeConverter::javaObjectToJsValue(rt, env, proxySupport);
	env->DeleteLocalRef(proxySupport);
	return result;
}

extern "C" {

JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_hermes_HermesObject_nativeInitObject
	(JNIEnv *env, jclass clazz, jclass proxyClass, jobject proxyObject)
{
	RuntimeScope scope;
	if (!scope.valid()) {
		return;
	}
	JNIScope jniScope(env);
	jsi::Runtime& rt = TiRuntime::rt();
	try {
		ProxyFactory::createJsProxy(rt, proxyClass, proxyObject);
	} catch (const jsi::JSError& error) {
		JSUtil::handleUncaught(rt, error);
	} catch (const std::exception& error) {
		JSUtil::reportException(error);
	}
}

JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_hermes_HermesObject_nativeSetProperty
	(JNIEnv *env, jobject object, jlong ptr, jstring name, jobject value)
{
	RuntimeScope scope;
	if (!scope.valid()) {
		return;
	}
	JNIScope jniScope(env);
	jsi::Runtime& rt = TiRuntime::rt();
	RuntimeState& state = *TiRuntime::state;

	try {
		jsi::Value jsValue = jsObjectFor(rt, env, ptr, object);
		if (!jsValue.isObject()) {
			return;
		}
		jsi::Object jsObject = jsValue.getObject(rt);
		jsi::Value properties = jsObject.getProperty(rt, state.propertiesProp);
		if (!properties.isObject()) {
			return;
		}

		jsi::Value jsName = TypeConverter::javaStringToJsString(rt, env, name);
		if (!jsName.isString()) {
			return;
		}

		// Give the object an accessor for the name, so that JS code can read the value
		// and so that a write from JS reaches the Java proxy.
		static const jsi::HostFunctionType onChanged =
			[](jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count) -> jsi::Value {
				if (count >= 3 && args[1].isString()) {
					Proxy::onPropertyChanged(rt, args[0], args[1].getString(rt).utf8(rt), args[2]);
				}
				return jsi::Value::undefined();
			};
		state.defineDynamicProperty.call(rt, jsObject, jsName, JSUtil::hostFunction(rt, "onPropertyChanged", 3, onChanged));

		properties.getObject(rt).setProperty(rt, jsi::PropNameID::forString(rt, jsName.getString(rt)),
			TypeConverter::javaObjectToJsValue(rt, env, value));
	} catch (const jsi::JSError& error) {
		JSUtil::handleUncaught(rt, error);
	} catch (const std::exception& error) {
		JSUtil::reportException(error);
	}
}

JNIEXPORT jboolean JNICALL
Java_org_appcelerator_kroll_runtime_hermes_HermesObject_nativeFireEvent
	(JNIEnv *env, jobject jEmitter, jlong ptr, jobject jsource, jlong sourcePtr, jstring event, jobject data,
	 jboolean bubble, jboolean reportSuccess, jint code, jstring errorMessage)
{
	RuntimeScope scope;
	if (!scope.valid()) {
		return JNI_FALSE;
	}
	JNIScope jniScope(env);
	jsi::Runtime& rt = TiRuntime::rt();
	RuntimeState& state = *TiRuntime::state;

	try {
		jsi::Value jsEvent = TypeConverter::javaStringToJsString(rt, env, event);

		jsi::Value emitterValue = jsObjectFor(rt, env, ptr, jEmitter);
		if (!emitterValue.isObject()) {
			return JNI_FALSE;
		}
		jsi::Object emitter = emitterValue.getObject(rt);

		jsi::Value fireEventValue = emitter.getProperty(rt, state.emitProp);
		if (!fireEventValue.isObject() || !fireEventValue.getObject(rt).isFunction(rt)) {
			return JNI_FALSE;
		}

		jsi::Value source;
		if ((jsource == NULL) || env->IsSameObject(jsource, jEmitter)) {
			source = jsi::Value(rt, emitter);
		} else {
			source = jsObjectFor(rt, env, sourcePtr, jsource);
		}

		jsi::Object jsData = TypeConverter::javaHashMapToJsValue(rt, env, data);
		jsData.setProperty(rt, "bubbles", (bool) bubble);
		jsData.setProperty(rt, "source", source);
		jsData.setProperty(rt, "type", jsEvent);

		if (reportSuccess || code != 0) {
			jsData.setProperty(rt, "success", code == 0);
			jsData.setProperty(rt, "code", (double) code);
		}

		if (errorMessage != NULL) {
			jsData.setProperty(rt, "error", TypeConverter::javaStringToJsString(rt, env, errorMessage));
		}

		jsi::Value result = fireEventValue.getObject(rt).getFunction(rt).callWithThis(rt, emitter, jsEvent, jsData);
		return (result.isBool() && result.getBool()) ? JNI_TRUE : JNI_FALSE;
	} catch (const jsi::JSError& error) {
		JSUtil::handleUncaught(rt, error);
	} catch (const std::exception& error) {
		JSUtil::reportException(error);
	}
	return JNI_FALSE;
}

JNIEXPORT jobject JNICALL
Java_org_appcelerator_kroll_runtime_hermes_HermesObject_nativeCallProperty
	(JNIEnv* env, jobject javaObject, jlong ptr, jstring propertyName, jobjectArray args)
{
	RuntimeScope scope;
	if (!scope.valid()) {
		return JNIUtil::undefinedObject;
	}
	JNIScope jniScope(env);
	jsi::Runtime& rt = TiRuntime::rt();

	try {
		jsi::Value jsValue = jsObjectFor(rt, env, ptr, javaObject);
		if (!jsValue.isObject()) {
			LOGW(TAG, "Unable to get the JSObject representing this Java object, returning undefined.");
			return JNIUtil::undefinedObject;
		}
		jsi::Object jsObject = jsValue.getObject(rt);

		jsi::Value jsPropertyName = TypeConverter::javaStringToJsString(rt, env, propertyName);
		if (!jsPropertyName.isString()) {
			return JNIUtil::undefinedObject;
		}
		jsi::Value property = jsObject.getProperty(rt, jsi::PropNameID::forString(rt, jsPropertyName.getString(rt)));
		if (!property.isObject() || !property.getObject(rt).isFunction(rt)) {
			return JNIUtil::undefinedObject;
		}

		std::vector<jsi::Value> jsArgs = TypeConverter::javaObjectArrayToJsArguments(rt, env, args);
		jsi::Value returnValue = property.getObject(rt).getFunction(rt)
			.callWithThis(rt, jsObject, static_cast<const jsi::Value*>(jsArgs.data()), jsArgs.size());

		bool isNew;
		return TypeConverter::jsValueToJavaObject(rt, env, returnValue, &isNew);
	} catch (const jsi::JSError& error) {
		JSUtil::handleUncaught(rt, error);
	} catch (const std::exception& error) {
		JSUtil::reportException(error);
	}
	return JNIUtil::undefinedObject;
}

// The V8 runtime deletes the native proxy here if JS code dropped the object. In this runtime,
// the proxy pair is deleted when Hermes collects the JS object, so Java does not have to ask.
JNIEXPORT jboolean JNICALL
Java_org_appcelerator_kroll_runtime_hermes_HermesObject_nativeRelease
	(JNIEnv *env, jobject self, jlong refPointer)
{
	return JNI_FALSE;
}

JNIEXPORT void JNICALL
Java_org_appcelerator_kroll_runtime_hermes_HermesObject_nativeSetWindow
	(JNIEnv *env, jobject javaKrollWindow, jlong ptr, jobject javaWindow)
{
	RuntimeScope scope;
	if (!scope.valid()) {
		return;
	}
	JNIScope jniScope(env);
	jsi::Runtime& rt = TiRuntime::rt();

	try {
		jsi::Value jsValue = jsObjectFor(rt, env, ptr, javaKrollWindow);
		if (!jsValue.isObject()) {
			return;
		}
		jsi::Object jsKrollWindow = jsValue.getObject(rt);

		jsi::Value setWindowValue = jsKrollWindow.getProperty(rt, "setWindow");
		if (!setWindowValue.isObject() || !setWindowValue.getObject(rt).isFunction(rt)) {
			return;
		}

		jsi::Value jsWindow = TypeConverter::javaObjectToJsValue(rt, env, javaWindow);
		if (!jsWindow.isNull()) {
			setWindowValue.getObject(rt).getFunction(rt).callWithThis(rt, jsKrollWindow, jsWindow);
		}
	} catch (const jsi::JSError& error) {
		JSUtil::handleUncaught(rt, error);
	} catch (const std::exception& error) {
		JSUtil::reportException(error);
	}
}

} // extern "C"
