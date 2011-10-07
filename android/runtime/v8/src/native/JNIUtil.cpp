/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>
#include <stdio.h>

#include "JNIUtil.h"
#include "AndroidUtil.h"

#define TAG "JNIUtil"

namespace titanium {

JavaVM* JNIUtil::javaVm = NULL;
jclass JNIUtil::classClass = NULL;
jclass JNIUtil::objectClass = NULL;
jclass JNIUtil::stringClass = NULL;
jclass JNIUtil::numberClass = NULL;
jclass JNIUtil::shortClass = NULL;
jclass JNIUtil::integerClass = NULL;
jclass JNIUtil::longClass = NULL;
jclass JNIUtil::floatClass = NULL;
jclass JNIUtil::doubleClass = NULL;
jclass JNIUtil::booleanClass = NULL;
jclass JNIUtil::objectArrayClass = NULL;
jclass JNIUtil::shortArrayClass = NULL;
jclass JNIUtil::intArrayClass = NULL;
jclass JNIUtil::longArrayClass = NULL;
jclass JNIUtil::floatArrayClass = NULL;
jclass JNIUtil::doubleArrayClass = NULL;
jclass JNIUtil::booleanArrayClass = NULL;
jclass JNIUtil::arrayListClass = NULL;
jclass JNIUtil::hashMapClass = NULL;
jclass JNIUtil::dateClass = NULL;
jclass JNIUtil::setClass = NULL;
jclass JNIUtil::outOfMemoryError = NULL;
jclass JNIUtil::nullPointerException = NULL;
jclass JNIUtil::throwableClass = NULL;

jclass JNIUtil::krollProxyClass = NULL;
jclass JNIUtil::v8ObjectClass = NULL;
jclass JNIUtil::managedV8ReferenceClass = NULL;
jclass JNIUtil::assetsClass = NULL;
jclass JNIUtil::eventEmitterClass = NULL;
jclass JNIUtil::v8CallbackClass = NULL;
jclass JNIUtil::v8InvocationClass = NULL;

jmethodID JNIUtil::classGetNameMethod = NULL;
jmethodID JNIUtil::arrayListInitMethod = NULL;
jmethodID JNIUtil::arrayListAddMethod = NULL;
jmethodID JNIUtil::arrayListGetMethod = NULL;
jmethodID JNIUtil::arrayListRemoveMethod = NULL;
jmethodID JNIUtil::hashMapInitMethod = NULL;
jmethodID JNIUtil::hashMapGetMethod = NULL;
jmethodID JNIUtil::hashMapPutMethod = NULL;
jmethodID JNIUtil::hashMapKeySetMethod = NULL;
jmethodID JNIUtil::hashMapRemoveMethod = NULL;
jmethodID JNIUtil::setToArrayMethod = NULL;
jmethodID JNIUtil::dateInitMethod = NULL;
jmethodID JNIUtil::dateGetTimeMethod = NULL;
jmethodID JNIUtil::doubleInitMethod = NULL;
jmethodID JNIUtil::booleanInitMethod = NULL;
jmethodID JNIUtil::booleanBooleanValueMethod = NULL;
jmethodID JNIUtil::longInitMethod = NULL;
jmethodID JNIUtil::numberDoubleValueMethod = NULL;
jmethodID JNIUtil::throwableGetMessageMethod = NULL;

jfieldID JNIUtil::managedV8ReferencePtrField = NULL;
jmethodID JNIUtil::krollProxyCreateMethod = NULL;
jfieldID JNIUtil::krollProxyModelListenerField = NULL;
jmethodID JNIUtil::krollProxySetIndexedPropertyMethod = NULL;
jmethodID JNIUtil::krollProxyGetIndexedPropertyMethod = NULL;
jmethodID JNIUtil::krollProxyOnPropertyChangedMethod = NULL;
jmethodID JNIUtil::krollProxyOnPropertiesChangedMethod = NULL;
jmethodID JNIUtil::v8ObjectInitMethod = NULL;
jmethodID JNIUtil::assetsReadResourceMethod = NULL;
jmethodID JNIUtil::eventEmitterHasListenersForEventTypeMethod = NULL;
jmethodID JNIUtil::v8CallbackInitMethod = NULL;
jmethodID JNIUtil::v8InvocationInitMethod = NULL;

JNIEnv* JNIScope::current = NULL;

/* static */
JNIEnv* JNIUtil::getJNIEnv()
{
	JNIEnv *env;
	int status = javaVm->GetEnv((void **) &env, JNI_VERSION_1_4);
	if (status < 0) {
		return NULL;
	}
	return env;
}

void JNIUtil::terminateVM()
{
	javaVm->DestroyJavaVM();
}

jobjectArray JNIUtil::newObjectArray(int length, jobject initial)
{
	JNIEnv* env = JNIScope::getEnv();
	if (env) {
		return env->NewObjectArray(length, objectClass, initial);
	}
	return NULL;
}

void JNIUtil::throwException(jclass clazz, const char *message)
{
	JNIEnv* env = JNIScope::getEnv();
	if (!env || !clazz) {
		return;
	}
	env->ExceptionClear();
	env->ThrowNew(clazz, message);
}

void JNIUtil::throwException(const char *className, const char *message)
{
	JNIEnv* env = JNIScope::getEnv();
	if (!env) {
		return;
	}
	jclass clazz = findClass(className);
	throwException(clazz, message);
	env->DeleteLocalRef(clazz);
}

void JNIUtil::throwOutOfMemoryError(const char *message)
{
	throwException(outOfMemoryError, message);
}

void JNIUtil::throwNullPointerException(const char *message)
{
	throwException(nullPointerException, message);
}

jclass JNIUtil::findClass(const char *className)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		LOGE(TAG, "Couldn't initialize JNIEnv");
		return NULL;
	}

	jclass javaClass = env->FindClass(className);
	if (!javaClass) {
		LOGE(TAG, "Couldn't find Java class: %s", className);
		if (env->ExceptionCheck()) {
			env->ExceptionDescribe();
			env->ExceptionClear();
		}
		return NULL;
	} else {
		jclass globalClass = (jclass) env->NewGlobalRef(javaClass);
		env->DeleteLocalRef(javaClass);
		return globalClass;
	}
}

jmethodID JNIUtil::getMethodID(jclass javaClass, const char *methodName, const char *signature, bool isStatic)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		LOGE(TAG, "Couldn't initialize JNIEnv");
		return NULL;
	}

	jmethodID javaMethodID;
	if (isStatic) {
		javaMethodID = env->GetStaticMethodID(javaClass, methodName, signature);
	} else {
		javaMethodID = env->GetMethodID(javaClass, methodName, signature);
	}

	if (!javaMethodID) {
		LOGE(TAG, "Couldn't find Java method ID: %s %s", methodName, signature);
		if (env->ExceptionCheck()) {
			env->ExceptionDescribe();
			env->ExceptionClear();
		}
	}
	return javaMethodID;
}

jfieldID JNIUtil::getFieldID(jclass javaClass, const char *fieldName, const char *signature)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		LOGE(TAG, "Couldn't initialize JNIEnv");
		return NULL;
	}
	jfieldID javaFieldID = env->GetFieldID(javaClass, fieldName, signature);
	if (!javaFieldID) {
		LOGE(TAG, "Couldn't find Java field ID: %s %s", fieldName, signature);
		if (env->ExceptionCheck()) {
			env->ExceptionDescribe();
			env->ExceptionClear();
		}
	}
	return javaFieldID;
}

jstring JNIUtil::getClassName(jclass javaClass)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) return NULL;

	return (jstring) env->CallObjectMethod(javaClass, classGetNameMethod);
}

void JNIUtil::logClassName(const char *format, jclass javaClass, bool errorLevel)
{
	JNIEnv *env = JNIScope::getEnv();
	if (!env) return;

	jstring jClassName = (jstring) env->CallObjectMethod(javaClass, classGetNameMethod);
	const char* chars = env->GetStringUTFChars(jClassName, NULL);

	if (errorLevel) {
		LOGE(TAG, format, chars);
	} else {
		LOGD(TAG, format, chars);
	}

	env->ReleaseStringUTFChars(jClassName, chars);
	env->DeleteLocalRef(jClassName);
}

void JNIUtil::initCache()
{
	LOG_TIMER(TAG, "initializing JNI cache");

	JNIEnv *env = JNIScope::getEnv();
	classClass = findClass("java/lang/Class");
	objectClass = findClass("java/lang/Object");
	numberClass = findClass("java/lang/Number");
	stringClass = findClass("java/lang/String");
	shortClass = findClass("java/lang/Short");
	integerClass = findClass("java/lang/Integer");
	longClass = findClass("java/lang/Long");
	floatClass = findClass("java/lang/Float");
	doubleClass = findClass("java/lang/Double");
	booleanClass = findClass("java/lang/Boolean");
	shortArrayClass = findClass("[S");
	intArrayClass = findClass("[I");
	longArrayClass = findClass("[J");
	floatArrayClass = findClass("[F");
	doubleArrayClass = findClass("[D");
	booleanArrayClass = findClass("[Z");
	objectArrayClass = findClass("[Ljava/lang/Object;");
	arrayListClass = findClass("java/util/ArrayList");
	hashMapClass = findClass("java/util/HashMap");
	dateClass = findClass("java/util/Date");
	setClass = findClass("java/util/Set");
	outOfMemoryError = findClass("java/lang/OutOfMemoryError");
	nullPointerException = findClass("java/lang/NullPointerException");
	throwableClass = findClass("java/lang/Throwable");

	krollProxyClass = findClass("org/appcelerator/kroll/KrollProxy");
	v8ObjectClass = findClass("org/appcelerator/kroll/runtime/v8/V8Object");
	managedV8ReferenceClass = findClass("org/appcelerator/kroll/runtime/v8/ManagedV8Reference");
	assetsClass = findClass("org/appcelerator/kroll/runtime/Assets");
	eventEmitterClass = findClass("org/appcelerator/kroll/runtime/v8/EventEmitter");
	v8CallbackClass = findClass("org/appcelerator/kroll/runtime/v8/V8Callback");
	v8InvocationClass = findClass("org/appcelerator/kroll/runtime/v8/V8Invocation");

	classGetNameMethod = getMethodID(classClass, "getName", "()Ljava/lang/String;", false);
	arrayListInitMethod = getMethodID(arrayListClass, "<init>", "()V", false);
	arrayListAddMethod = getMethodID(arrayListClass, "add", "(Ljava/lang/Object;)Z", false);
	arrayListGetMethod = getMethodID(arrayListClass, "get", "(I)Ljava/lang/Object;", false);
	arrayListRemoveMethod = getMethodID(arrayListClass, "remove", "(I)Ljava/lang/Object;", false);
	hashMapInitMethod = getMethodID(hashMapClass, "<init>", "(I)V", false);
	hashMapGetMethod = getMethodID(hashMapClass, "get", "(Ljava/lang/Object;)Ljava/lang/Object;", false);
	hashMapPutMethod = getMethodID(hashMapClass, "put", "(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;",
		false);
	hashMapKeySetMethod = getMethodID(hashMapClass, "keySet", "()Ljava/util/Set;", false);
	hashMapRemoveMethod = getMethodID(hashMapClass, "remove", "(Ljava/lang/Object;)Ljava/lang/Object;", false);

	setToArrayMethod = getMethodID(setClass, "toArray", "()[Ljava/lang/Object;", false);

	dateInitMethod = getMethodID(dateClass, "<init>", "(J)V", false);
	dateGetTimeMethod = getMethodID(dateClass, "getTime", "()J", false);

	doubleInitMethod = getMethodID(doubleClass, "<init>", "(D)V", false);
	booleanInitMethod = getMethodID(booleanClass, "<init>", "(Z)V", false);
	booleanBooleanValueMethod = getMethodID(booleanClass, "booleanValue", "()Z", false);
	longInitMethod = getMethodID(longClass, "<init>", "(J)V", false);
	numberDoubleValueMethod = getMethodID(numberClass, "doubleValue", "()D", false);
	throwableGetMessageMethod = getMethodID(throwableClass, "getMessage", "()Ljava/lang/String;", false);

	v8ObjectInitMethod = getMethodID(v8ObjectClass, "<init>", "(J)V", false);
	managedV8ReferencePtrField = getFieldID(managedV8ReferenceClass, "ptr", "J");
	krollProxyCreateMethod = getMethodID(krollProxyClass, "create",
		"(Ljava/lang/Class;[Ljava/lang/Object;JLjava/lang/String;)Lorg/appcelerator/kroll/KrollProxy;", true);
	krollProxyModelListenerField = getFieldID(krollProxyClass, "modelListener", "Lorg/appcelerator/kroll/KrollProxyListener;");
	krollProxySetIndexedPropertyMethod = getMethodID(krollProxyClass, "setIndexedProperty", "(ILjava/lang/Object;)V");
	krollProxyGetIndexedPropertyMethod = getMethodID(krollProxyClass, "getIndexedProperty", "(I)Ljava/lang/Object;");
	krollProxyOnPropertyChangedMethod = getMethodID(krollProxyClass, "onPropertyChanged",
		"(Ljava/lang/String;Ljava/lang/Object;)V");
	krollProxyOnPropertiesChangedMethod = getMethodID(krollProxyClass, "onPropertiesChanged",
		"([[Ljava/lang/Object;)V", false);

	assetsReadResourceMethod = getMethodID(assetsClass, "readResource", "(Ljava/lang/String;)[C", true);
	eventEmitterHasListenersForEventTypeMethod = getMethodID(eventEmitterClass, "hasListenersForEventType",
		"(Ljava/lang/String;Z)V");

	v8CallbackInitMethod = getMethodID(v8CallbackClass, "<init>", "(J)V", false);
	v8InvocationInitMethod = getMethodID(v8InvocationClass, "<init>", "(Ljava/lang/String;)V", false);
}

} // namespace titanium
