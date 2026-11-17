/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include "ProxyFactory.h"

#include "AndroidUtil.h"
#include "JNIUtil.h"
#include "JSException.h"
#include "JSUtil.h"
#include "KrollBindings.h"
#include "Proxy.h"
#include "TiRuntime.h"
#include "TypeConverter.h"

#define TAG "ProxyFactory"

namespace titanium {

#define LOG_JNIENV_ERROR(msgMore) \
	LOGE(TAG, "Unable to find class %s", msgMore);

jsi::Value ProxyFactory::createJsProxy(jsi::Runtime& rt, jclass javaClass, jobject javaProxy)
{
	return createJsProxy(rt, getJavaClassName(javaClass), javaProxy);
}

jsi::Value ProxyFactory::createJsProxy(jsi::Runtime& rt, const std::string& className, jobject javaProxy)
{
	LOGD(TAG, "ProxyFactory::createJsProxy");
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		LOG_JNIENV_ERROR("while creating Java proxy.");
		return jsi::Value::undefined();
	}
	RuntimeState& state = *TiRuntime::state;

	jsi::Value exportsValue = KrollBindings::getBinding(rt, className);
	if (!exportsValue.isObject()) {
		LOGE(TAG, "Failed to find class for %s", className.c_str());
		LOG_JNIENV_ERROR("while creating JS Proxy.");
		return jsi::Value::undefined();
	}
	jsi::Object exports = exportsValue.getObject(rt);

	try {
		jsi::Value possibleConstructor;
		jsi::Value hasConstructor = state.hasOwn.call(rt, exports, jsi::String::createFromAscii(rt, "constructor"));
		if (hasConstructor.isBool() && hasConstructor.getBool()) {
			possibleConstructor = exports.getProperty(rt, "constructor");
		} else {
			// Fallback to old behaviour of selecting first property for constructor.
			jsi::Array propertyNames = exports.getPropertyNames(rt);
			if (propertyNames.size(rt) > 0) {
				possibleConstructor = exports.getProperty(rt,
					jsi::PropNameID::forString(rt, propertyNames.getValueAtIndex(rt, 0).toString(rt)));
			}
		}

		if (!possibleConstructor.isObject() || !possibleConstructor.getObject(rt).isFunction(rt)) {
			LOGE(TAG, "Failed to get constructor in exports for %s", className.c_str());
			LOG_JNIENV_ERROR("while creating JS Proxy.");
			return jsi::Value::undefined();
		}
		jsi::Function creator = possibleConstructor.getObject(rt).getFunction(rt);

		// The constructor takes the Java object from here and does not create a new one.
		Proxy::pendingJavaProxy = javaProxy;
		jsi::Value jsProxy;
		try {
			jsProxy = creator.callAsConstructor(rt);
		} catch (...) {
			Proxy::pendingJavaProxy = NULL;
			throw;
		}
		Proxy::pendingJavaProxy = NULL;

		Proxy* proxy = Proxy::unwrap(rt, jsProxy);
		if (!proxy) {
			LOGE(TAG, "The constructor for %s did not return a proxy.", className.c_str());
			return jsi::Value::undefined();
		}

		// Store the id of the native Proxy on the Java side. Java uses it to find the JS object again.
		jobject javaHermesObject = env->NewObject(JNIUtil::jsObjectClass, JNIUtil::jsObjectInitMethod, proxy->id());
		env->SetObjectField(javaProxy, JNIUtil::krollProxyKrollObjectField, javaHermesObject);
		env->DeleteLocalRef(javaHermesObject);

		// The Java proxy has its HermesObject now, so the canary has a place to live.
		proxy->arm();
		return jsProxy;
	} catch (const jsi::JSError& error) {
		LOGE(TAG, "Exception thrown while creating JS proxy.");
		JSUtil::reportException(rt, error);
		return jsi::Value::undefined();
	}
}

jobject ProxyFactory::createJavaProxy(jsi::Runtime& rt, jclass javaClass, Proxy* proxy, const jsi::Value& ctorArgs)
{
	LOGD(TAG, "ProxyFactory::createJavaProxy");
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		LOG_JNIENV_ERROR("while creating Java proxy.");
		return NULL;
	}
	RuntimeState& state = *TiRuntime::state;

	// "ctorArgs" is the Arguments object of the JS constructor.
	int argCount = 0;
	jsi::Value firstArg;
	if (ctorArgs.isObject()) {
		jsi::Object argsObject = ctorArgs.getObject(rt);
		jsi::Value length = argsObject.getProperty(rt, state.lengthProp);
		argCount = length.isNumber() ? (int) length.getNumber() : 0;
		if (argCount > 0) {
			firstArg = argsObject.getProperty(rt, "0");
		}
	}

	// Determine if this constructor call was made within
	// the createXYZ() wrapper function. This can be tested by checking
	// if an Arguments object was passed as the sole argument.
	bool calledFromCreate = argCount == 1 && JSUtil::isArguments(rt, firstArg);

	// We also pass the creation URL of the proxy so we can track relative URLs
	// First see if this is getting passed in for us already
	jstring javaSourceUrl = NULL;

	// Convert the JS arguments into Java types so they can be
	// passed to the Java creator method. Which converter we use
	// depends how this constructor was called.
	jobjectArray javaArgs;
	if (calledFromCreate) {
		jsi::Object arguments = firstArg.getObject(rt);
		jsi::Value lengthValue = arguments.getProperty(rt, state.lengthProp);
		int length = lengthValue.isNumber() ? (int) lengthValue.getNumber() : 0;
		int start = 0;

		// Get the scope variables if provided and extract the source URL.
		// We need to send that to the Java side when creating the proxy.
		if (length > 0) {
			jsi::Value scopeVars = arguments.getProperty(rt, "0");
			if (JSUtil::constructorNameMatches(rt, scopeVars, "ScopeVars")) {
				jsi::Value sourceUrl = scopeVars.getObject(rt).getProperty(rt, "sourceUrl");
				javaSourceUrl = TypeConverter::jsValueToJavaString(rt, env, sourceUrl);
				start = 1;
			}
		}
		javaArgs = TypeConverter::jsObjectIndexPropsToJavaArray(rt, env, arguments, start, length);
	} else if (ctorArgs.isObject()) {
		javaArgs = TypeConverter::jsObjectIndexPropsToJavaArray(rt, env, ctorArgs.getObject(rt), 0, argCount);
	} else {
		javaArgs = env->NewObjectArray(0, JNIUtil::objectClass, NULL);
	}

	// This does: Object javaHermesObject = new HermesObject(proxyId);
	jobject javaHermesObject = env->NewObject(JNIUtil::jsObjectClass, JNIUtil::jsObjectInitMethod, proxy->id());

	// We were not given the source URL. Take it from the JS stack of the caller.
	if (javaSourceUrl == NULL) {
		jsi::Value sourceUrl = state.currentSourceUrl.call(rt);
		if (sourceUrl.isString()) {
			javaSourceUrl = TypeConverter::jsValueToJavaString(rt, env, sourceUrl);
		} else {
			javaSourceUrl = env->NewStringUTF("app://app.js");
		}
	}

	// This does: KrollProxy.createProxy(javaClass, javaHermesObject, javaArgs, javaSourceUrl);
	// Which creates a new instance of the class using default no-arg constructor,
	// and then calls #setupProxy() with the rest of the args on the instance.
	jobject javaProxy = env->CallStaticObjectMethod(JNIUtil::krollProxyClass,
		JNIUtil::krollProxyCreateProxyMethod, javaClass, javaHermesObject, javaArgs, javaSourceUrl);

	if (javaSourceUrl) {
		env->DeleteLocalRef(javaSourceUrl);
	}
	env->DeleteLocalRef(javaHermesObject);
	env->DeleteLocalRef(javaArgs);
	// We don't delete the global jclass reference...

	JSException::checkJavaException(rt, env);

	return javaProxy;
}

std::string ProxyFactory::getJavaClassName(jclass javaClass)
{
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		LOGE(TAG, "Unable to get JNIEnv while getting Java class name.");
		return std::string();
	}
	jstring javaClassName = JNIUtil::getClassName(javaClass);
	const char* chars = env->GetStringUTFChars(javaClassName, NULL);
	std::string className(chars ? chars : "");
	env->ReleaseStringUTFChars(javaClassName, chars);
	env->DeleteLocalRef(javaClassName);
	return className;
}

void ProxyFactory::dispose()
{
	Proxy::pendingJavaProxy = NULL;
}

} // namespace titanium
