/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <jni.h>

#include "JNIUtil.h"

namespace titanium
{
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

	jobject JNIUtil::undefined = NULL;

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

	jobjectArray JNIUtil::newObjectArray(int length, jobject initial)
	{
		JNIEnv* env = getJNIEnv();
		if (env)
		{
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
		jclass clazz = env->FindClass(className);
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

	void JNIUtil::initCache(JNIEnv* env, jobject undefinedObj)
	{
		undefined = env->NewGlobalRef(undefinedObj);

		objectClass = env->FindClass("java/lang/Object");
		numberClass = env->FindClass("java/lang/Number");
		stringClass = env->FindClass("java/lang/String");
		shortClass = env->FindClass("java/lang/Short");
		integerClass = env->FindClass("java/lang/Integer");
		longClass = env->FindClass("java/lang/Long");
		floatClass = env->FindClass("java/lang/Float");
		doubleClass = env->FindClass("java/lang/Double");
		booleanClass = env->FindClass("java/lang/Boolean");
		hashMapClass = env->FindClass("java/util/HashMap");
		dateClass = env->FindClass("java/util/Date");
		setClass = env->FindClass("java/util/Set");
		outOfMemoryError = env->FindClass("java/lang/OutOfMemoryError");
		nullPointerException = env->FindClass("java/lang/NullPointerException");
		krollProxyClass = env->FindClass("org/appcelerator/kroll/KrollProxy");
		v8ObjectClass = env->FindClass("org/appcelerator/kroll/runtime/v8/V8Object");

		hashMapInitMethod = env->GetMethodID(hashMapClass, "put", "(I)V");
		hashMapGetMethod = env->GetMethodID(hashMapClass, "get", "(Ljava/lang/Object;);Ljava/lang/Object;");
		hashMapPutMethod = env->GetMethodID(hashMapClass, "put", "(Ljava/lang/Object;Ljava/lang/Object;);Ljava/lang/Object;");
		hashMapKeySetMethod = env->GetMethodID(hashMapClass, "keySet", "();Ljava/util/Set;");
		setToArrayMethod = env->GetMethodID(setClass, "toArray", "();[Ljava/lang/Object;");

		dateInitMethod = env->GetMethodID(dateClass, "<init>", "(J)V");
		dateGetTimeMethod = env->GetMethodID(dateClass,  "getTime", "()J");

		doubleInitMethod = env->GetMethodID(doubleClass, "<init>", "(D)V");
		booleanInitMethod = env->GetMethodID(booleanClass, "<init>", "(Z)V");
		longInitMethod = env->GetMethodID(longClass, "<init>", "(J)V");

		numberDoubleValueMethod = env->GetMethodID(numberClass, "doubleValue", "()J");
		v8ObjectInitMethod = env->GetMethodID(v8ObjectClass, "<init>", "()V");
		krollProxyGetV8ObjectPointerMethod = env->GetMethodID(krollProxyClass, "getV8ObjectPointer","()J");
	}
}
