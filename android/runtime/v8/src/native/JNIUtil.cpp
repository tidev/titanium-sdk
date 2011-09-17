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
jclass JNIUtil::objectClass = NULL;
jclass JNIUtil::stringClass = NULL;
jclass JNIUtil::numberClass = NULL;
jclass JNIUtil::shortClass = NULL;
jclass JNIUtil::integerClass = NULL;
jclass JNIUtil::longClass = NULL;
jclass JNIUtil::floatClass = NULL;
jclass JNIUtil::doubleClass = NULL;
jclass JNIUtil::booleanClass = NULL;
jclass JNIUtil::hashMapClass = NULL;
jclass JNIUtil::dateClass = NULL;
jclass JNIUtil::setClass = NULL;
jclass JNIUtil::outOfMemoryError = NULL;
jclass JNIUtil::nullPointerException = NULL;

jclass JNIUtil::krollProxyClass = NULL;
jclass JNIUtil::v8ObjectClass = NULL;

jmethodID JNIUtil::krollProxyGetV8ObjectPointerMethod = NULL;
jmethodID JNIUtil::v8ObjectInitMethod = NULL;
jmethodID JNIUtil::hashMapInitMethod = NULL;
jmethodID JNIUtil::hashMapGetMethod = NULL;
jmethodID JNIUtil::hashMapPutMethod = NULL;
jmethodID JNIUtil::hashMapKeySetMethod = NULL;
jmethodID JNIUtil::setToArrayMethod = NULL;
jmethodID JNIUtil::dateInitMethod = NULL;
jmethodID JNIUtil::dateGetTimeMethod = NULL;
jmethodID JNIUtil::doubleInitMethod = NULL;
jmethodID JNIUtil::booleanInitMethod = NULL;
jmethodID JNIUtil::longInitMethod = NULL;
jmethodID JNIUtil::numberDoubleValueMethod = NULL;

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
	JNIEnv* env = getJNIEnv();
	if (env) {
		return env->NewObjectArray(length, objectClass, initial);
	}
	return NULL;
}

void JNIUtil::throwException(jclass clazz, const char *message)
{
	JNIEnv* env = getJNIEnv();
	if (!env || !clazz) {
		return;
	}
	env->ExceptionClear();
	env->ThrowNew(clazz, message);
}

void JNIUtil::throwException(const char *className, const char *message)
{
	JNIEnv* env = getJNIEnv();
	if (!env) {
		return;
	}
	jclass clazz = findClass(className, env);
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
jclass JNIUtil::findClass(const char *className, JNIEnv *env)
{
	if (!env) {
		env = getJNIEnv();
		if (!env) {
			LOGE(TAG, "Couldn't initialize JNIEnv");
			return NULL;
		}
	}

	jclass javaClass = env->FindClass(className);
	if (!javaClass) {
		LOGE(TAG, "Couldn't find Java class: %s", className);
		if (env->ExceptionCheck()) {
			env->ExceptionDescribe();
			env->ExceptionClear();
		}
	}
	return javaClass;
}

jmethodID JNIUtil::getMethodID(jclass javaClass, const char *methodName, const char *signature, JNIEnv *env)
{
	if (!env) {
		env = getJNIEnv();
		if (!env) {
			LOGE(TAG, "Couldn't initialize JNIEnv");
			return NULL;
		}
	}

	jmethodID javaMethodID = env->GetMethodID(javaClass, methodName, signature);
	if (!javaMethodID) {
		LOGE(TAG, "Couldn't find Java method ID: %s %s", methodName, signature);
		if (env->ExceptionCheck()) {
			env->ExceptionDescribe();
			env->ExceptionClear();
		}
	}
	return javaMethodID;
}

void JNIUtil::initCache(JNIEnv* env)
{
	objectClass = findClass("java/lang/Object", env);
	numberClass = findClass("java/lang/Number", env);
	stringClass = findClass("java/lang/String", env);
	shortClass = findClass("java/lang/Short", env);
	integerClass = findClass("java/lang/Integer", env);
	longClass = findClass("java/lang/Long", env);
	floatClass = findClass("java/lang/Float", env);
	doubleClass = findClass("java/lang/Double", env);
	booleanClass = findClass("java/lang/Boolean", env);
	hashMapClass = findClass("java/util/HashMap", env);
	dateClass = findClass("java/util/Date", env);
	setClass = findClass("java/util/Set", env);
	outOfMemoryError = findClass("java/lang/OutOfMemoryError", env);
	nullPointerException = findClass("java/lang/NullPointerException", env);
	krollProxyClass = findClass("org/appcelerator/kroll/KrollProxy", env);
	v8ObjectClass = findClass("org/appcelerator/kroll/runtime/v8/V8Object", env);

	hashMapInitMethod = getMethodID(hashMapClass, "<init>", "(I)V", env);
	hashMapGetMethod = getMethodID(hashMapClass, "get", "(Ljava/lang/Object;)Ljava/lang/Object;", env);
	hashMapPutMethod = getMethodID(hashMapClass, "put", "(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;", env);
	hashMapKeySetMethod = getMethodID(hashMapClass, "keySet", "()Ljava/util/Set;", env);

	setToArrayMethod = getMethodID(setClass, "toArray", "()[Ljava/lang/Object;", env);

	dateInitMethod = getMethodID(dateClass, "<init>", "(J)V", env);
	dateGetTimeMethod = getMethodID(dateClass, "getTime", "()J", env);

	doubleInitMethod = getMethodID(doubleClass, "<init>", "(D)V", env);
	booleanInitMethod = getMethodID(booleanClass, "<init>", "(Z)V", env);
	longInitMethod = getMethodID(longClass, "<init>", "(J)V", env);
	numberDoubleValueMethod = getMethodID(numberClass, "doubleValue", "()D", env);

	v8ObjectInitMethod = getMethodID(v8ObjectClass, "<init>", "(J)V", env);
	krollProxyGetV8ObjectPointerMethod = getMethodID(krollProxyClass, "getV8ObjectPointer", "()J", env);
}
}
