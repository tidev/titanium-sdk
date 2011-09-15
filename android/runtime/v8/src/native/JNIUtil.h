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

		static jobjectArray newObjectArray(int length, jobject initial = NULL);

		static jclass getObjectClass(JNIEnv* env = NULL);
		static jclass getStringClass(JNIEnv* env = NULL);
		static jclass getHashMapClass(JNIEnv* env = NULL);
		static jclass getV8ObjectClass(JNIEnv* env = NULL);

		static jmethodID getV8ObjectInitMethod(JNIEnv* env = NULL);
	};
}

#endif
