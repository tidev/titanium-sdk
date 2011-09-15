#include <jni.h>

#include <JNIUtil.h>

namespace titanium
{
	JavaVM* JNIUtil::javaVm = NULL;

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
			return env->NewObjectArray(length, getObjectClass(env), initial);
		}
		return NULL;
	}

#define CLASS_GETTER(name, fqName) \
	jclass JNIUtil::get ## name ## Class(JNIEnv* env) \
	{ \
		static jclass clazz = NULL; \
		if (!clazz) \
		{ \
			if (!env) env = getJNIEnv(); \
			if (env) \
			{ \
				clazz = env->FindClass(fqName); \
				return clazz; \
			} \
		} \
		return NULL; \
	}

	CLASS_GETTER(Object, "java/lang/Object")
	CLASS_GETTER(String, "java/lang/String")
	CLASS_GETTER(HashMap, "java/util/HashMap")
	CLASS_GETTER(V8Object, "org/appcelerator/kroll/runtime/v8/V8Object")

#define METHOD_GETTER(name, className, methodName, signature) \
	jmethodID JNIUtil::get ## name ## Method(JNIEnv* env) \
	{ \
		static jmethodID method = NULL; \
		if (!method) \
		{ \
			if (!env) env = getJNIEnv(); \
			if (env) \
			{ \
				jclass clazz = get ## className ## Class(env); \
				if (clazz) \
				{ \
					method = env->GetMethodID(clazz, methodName, signature); \
					return method; \
				} \
			} \
		} \
		return NULL; \
	}

	METHOD_GETTER(V8ObjectInit, V8Object, "<init>", "()V")
}
