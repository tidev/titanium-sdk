#include <V8Runtime.h>
#include <JNIUtil.h>
#include <TypeConverter.h>

namespace titanium
{
	/* static */
	void V8Runtime::collectWeakRef(Persistent<Value> ref, void *parameter)
	{
		jobject v8Object = (jobject) parameter;

		ref.Dispose();
		JNIUtil::getJNIEnv()->DeleteGlobalRef(v8Object);
	}

	/* static */
	jobject V8Runtime::newObject(Handle<Object> object)
	{
		HandleScope scope;

		Persistent<Object> *persistent = new Persistent<Object>(object);
		JNIEnv *env = JNIUtil::getJNIEnv();
		if (!env) return NULL;

		jobject v8Object = env->NewGlobalRef(env->NewObject(JNIUtil::v8ObjectClass,
			JNIUtil::v8ObjectInitMethod, reinterpret_cast<jlong>(persistent)));

		persistent->MakeWeak(reinterpret_cast<void*>(v8Object), V8Runtime::collectWeakRef);
		return v8Object;
	}
}


extern "C" void
Java_org_appcelerator_kroll_runtime_v8_V8Runtime_nativeInit(JNIEnv *env, jclass clazz)
{
	titanium::JNIUtil::initCache(env);
}

extern "C" jint JNI_OnLoad(JavaVM *vm, void *reserved)
{
	titanium::JNIUtil::javaVm = vm;
	return JNI_VERSION_1_4;
}
