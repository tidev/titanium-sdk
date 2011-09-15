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
		static void initCache(JNIEnv *env);

		static jobjectArray newObjectArray(int length, jobject initial = NULL);

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

		static jclass krollProxyClass;
		static jclass v8ObjectClass;

		static jmethodID v8ObjectInitMethod;
		static jmethodID hashMapGetMethod;
		static jmethodID hashMapKeySetMethod;
		static jmethodID setToArrayMethod;
		static jmethodID dateGetTimeMethod;
		static jmethodID numberDoubleValueMethod;
	};
}

#endif
