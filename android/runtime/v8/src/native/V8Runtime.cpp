#include <V8Runtime.h>

#include <AndroidUtil.h>
#include <JNIUtil.h>
#include <TypeConverter.h>

#define TAG "V8Runtime"

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
		LOGI(TAG, "Creating new object...");

		JNIEnv *env = JNIUtil::getJNIEnv();
		if (!env) return NULL;

		jlong ptr = reinterpret_cast<jlong>(*Persistent<Object>::New(object));
		jobject v8Object = env->NewGlobalRef(env->NewObject(JNIUtil::v8ObjectClass,
			JNIUtil::v8ObjectInitMethod, ptr));

		// make a 2nd persistent weakref so we can be informed of GC
		Persistent<Object> weak = Persistent<Object>::New(object);
		weak.MakeWeak(reinterpret_cast<void*>(v8Object), V8Runtime::collectWeakRef);
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
