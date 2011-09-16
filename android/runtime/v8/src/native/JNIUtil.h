#ifndef JNI_UTIL_H
#define JNI_UTIL_H

#include <stdint.h>
#include <jni.h>

namespace titanium
{
	class JNIUtil
	{
	public:
		static JavaVM *javaVm;
		static JNIEnv* getJNIEnv();
		static void initCache(JNIEnv *env, jobject undefined);

		static jobjectArray newObjectArray(int length, jobject initial = NULL);
		static void throwException(jclass clazz, const char *message);
		static void throwException(const char *className, const char *message);
		static void throwOutOfMemoryError(const char *message);
		static void throwNullPointerException(const char *message);

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
		static jmethodID v8ObjectInitMethod;

		static jobject undefined;
	};
}

#endif
