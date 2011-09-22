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

namespace titanium {
class JNIUtil
{
public:
	static JavaVM *javaVm;
	static JNIEnv* getJNIEnv();
	static void terminateVM();
	static void initCache();
	static jclass findClass(const char *className, JNIEnv *env = NULL);
	static jmethodID getMethodID(jclass javaClass, const char *methodName, const char *signature, bool isStatic = false,
		JNIEnv *env = NULL);
	static void logClassName(const char *format, jclass javaClass);

	static jobjectArray newObjectArray(int length, jobject initial = NULL);
	static void throwException(jclass clazz, const char *message);
	static void throwException(const char *className, const char *message);
	static void throwOutOfMemoryError(const char *message);
	static void throwNullPointerException(const char *message);

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
	static jclass hashMapClass;
	static jclass dateClass;
	static jclass setClass;
	static jclass outOfMemoryError;
	static jclass nullPointerException;

	static jclass krollProxyClass;
	static jclass v8ObjectClass;
	static jclass assetsClass;

	// Java methods
	static jmethodID classGetNameMethod;
	static jmethodID hashMapInitMethod;
	static jmethodID hashMapGetMethod;
	static jmethodID hashMapPutMethod;
	static jmethodID hashMapKeySetMethod;
	static jmethodID setToArrayMethod;
	static jmethodID dateInitMethod;
	static jmethodID dateGetTimeMethod;
	static jmethodID doubleInitMethod;
	static jmethodID booleanInitMethod;
	static jmethodID longInitMethod;
	static jmethodID numberDoubleValueMethod;

	// Titanium methods
	static jmethodID krollProxyGetV8ObjectPointerMethod;
	static jmethodID krollProxyCreateMethod;
	static jmethodID krollProxySetV8ObjectMethod;

	static jmethodID v8ObjectInitMethod;
	static jmethodID assetsReadResourceMethod;

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
