#include <jni.h>

#include <JNIUtil.h>

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

	jclass JNIUtil::krollProxyClass = NULL;
	jclass JNIUtil::v8ObjectClass = NULL;

	jmethodID JNIUtil::v8ObjectInitMethod = NULL;
	jmethodID JNIUtil::hashMapGetMethod = NULL;
	jmethodID JNIUtil::hashMapKeySetMethod = NULL;
	jmethodID JNIUtil::setToArrayMethod = NULL;
	jmethodID JNIUtil::dateGetTimeMethod = NULL;
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

	jobjectArray JNIUtil::newObjectArray(int length, jobject initial)
	{
		JNIEnv* env = getJNIEnv();
		if (env)
		{
			return env->NewObjectArray(length, objectClass, initial);
		}
		return NULL;
	}

	void JNIUtil::initCache(JNIEnv* env)
	{
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
		krollProxyClass = env->FindClass("org/appcelerator/kroll/KrollProxy");
		v8ObjectClass = env->FindClass("org/appcelerator/kroll/runtime/v8/V8Object");

		v8ObjectInitMethod = env->GetMethodID(v8ObjectClass, "<init>", "()V");
		hashMapGetMethod = env->GetMethodID(hashMapClass, "get", "(Ljava/lang/Object;);Ljava/lang/Object;");
		hashMapKeySetMethod = env->GetMethodID(hashMapClass, "keySet", "();Ljava/util/Set;");
		setToArrayMethod = env->GetMethodID(setClass, "toArray", "();[Ljava/lang/Object;");
		dateGetTimeMethod = env->GetMethodID(dateClass,  "getTime", "()J");
		numberDoubleValueMethod = env->GetMethodID(numberClass, "doubleValue", "()J");
	}
}
