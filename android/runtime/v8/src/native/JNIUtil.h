/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef JNI_UTIL_H
#define JNI_UTIL_H

#include <jni.h>
#include <stdint.h>
#include "AndroidUtil.h"

namespace titanium {
class JNIUtil
{
public:
	static JavaVM *javaVm;
	static JNIEnv* getJNIEnv();
	static void terminateVM();
	static void initCache();
	static jclass findClass(const char *className);
	static jmethodID getMethodID(jclass javaClass, const char *methodName, const char *signature, bool isStatic = false);
	static jfieldID getFieldID(jclass javaClass, const char *fieldName, const char *signature);
	static jstring getClassName(jclass javaClass);
	static void logClassName(const char *format, jclass javaClass, bool errorLevel = false);

	static jobjectArray newObjectArray(int length, jobject initial = NULL);
	static void throwException(jclass clazz, const char *message);
	static void throwException(const char *className, const char *message);
	static void throwOutOfMemoryError(const char *message);
	static void throwNullPointerException(const char *message);

	// Java classes
	static jclass classClass;
	static jclass objectClass;
	static jclass stringClass;
	static jclass numberClass;
	static jclass shortClass;
	static jclass integerClass;
	static jclass longClass;
	static jclass floatClass;
	static jclass doubleClass;
	static jclass booleanClass;
	static jclass arrayListClass;
	static jclass hashMapClass;
	static jclass dateClass;
	static jclass setClass;
	static jclass outOfMemoryError;
	static jclass throwableClass;
	static jclass nullPointerException;

	// Titanium classes
	static jclass managedV8ReferenceClass;
	static jclass v8ObjectClass;
	static jclass eventListenerClass;
	static jclass v8CallbackClass;
	static jclass assetsClass;
	static jclass krollProxyClass;
	static jclass v8InvocationClass;

	// Java methods
	static jmethodID classGetNameMethod;
	static jmethodID arrayListInitMethod;
	static jmethodID arrayListAddMethod;
	static jmethodID arrayListGetMethod;
	static jmethodID arrayListRemoveMethod;
	static jmethodID hashMapInitMethod;
	static jmethodID hashMapGetMethod;
	static jmethodID hashMapPutMethod;
	static jmethodID hashMapKeySetMethod;
	static jmethodID hashMapRemoveMethod;
	static jmethodID setToArrayMethod;
	static jmethodID dateInitMethod;
	static jmethodID dateGetTimeMethod;
	static jmethodID doubleInitMethod;
	static jmethodID booleanInitMethod;
	static jmethodID longInitMethod;
	static jmethodID numberDoubleValueMethod;
	static jmethodID throwableGetMessageMethod;

	// Titanium methods and fields
	static jfieldID managedV8ReferencePtrField;
	static jmethodID v8ObjectInitMethod;
	static jmethodID assetsReadResourceMethod;
	static jmethodID eventListenerPostEventMethod;
	static jmethodID v8CallbackInitMethod;
	static jmethodID v8InvocationInitMethod;

	static jmethodID krollProxyCreateMethod;
	static jfieldID krollProxyModelListenerField;
	static jmethodID krollProxyOnPropertiesChangedMethod;

};

class JNIScope
{
public:
	JNIScope(JNIEnv *env)
			: prev(current)
	{
		current = env;
	}
	~JNIScope()
	{
		current = prev;
	}
	static JNIEnv* getEnv()
	{
		return current != NULL ? current : JNIUtil::getJNIEnv();
	}
private:
	JNIScope(const JNIScope&);
	void operator=(const JNIScope&);
	void* operator new(size_t size);
	void operator delete(void*, size_t);

	static JNIEnv* current;
	JNIEnv* prev;
};

}

#endif
