#include <v8.h>
#include <jni.h>

using namespace v8;

static JavaVM *javaVm;
static jclass runtimeClass;
static jmethodID setCallbackId;
Persistent<Context> context;
Persistent<Function> fnHandle;

static Handle<Value> SetCallback(const Arguments& args)
{
	HandleScope scope;
	JNIEnv *env;

	javaVm->GetEnv((void **) &env, JNI_VERSION_1_4);

	fnHandle = Persistent<Function>::New(Handle<Function>::Cast(args[0]));
	env->CallVoidMethod(runtimeClass, setCallbackId, (jlong) &fnHandle);
	return Undefined();
}

extern "C" void
Java_org_appcelerator_kroll_runtime_v8_V8Function_nativeCall(JNIEnv *env, jlong handle)
{
	HandleScope scope;
	Persistent<Function>* fnHandle = reinterpret_cast<Persistent<Function>*>(handle);
	Handle<Value> args[] = {};

	(*fnHandle)->Call((*fnHandle), 0, args);
}

extern "C" void
Java_org_appcelerator_kroll_runtime_v8_V8Runtime_init(JNIEnv *env, jclass clazz, jstring source)
{
	HandleScope scope;
	runtimeClass = clazz;
	setCallbackId = env->GetMethodID(runtimeClass, "setCallback", "(Lorg/appcelerator/kroll/runtime/v8/V8Function;)V");

	Handle<ObjectTemplate> globalTemplate = ObjectTemplate::New();
	context = Context::New(NULL, globalTemplate);
	Context::Scope contextScope(context);

	context->Global()->Set(String::New("setCallback"), FunctionTemplate::New(SetCallback)->GetFunction());

	const char *srcData = const_cast<const char *>(env->GetStringUTFChars(source, NULL));
	Local<Script> script = Script::Compile(String::New(srcData), String::New("app:/app.js"));
	script->Run();

	env->ReleaseStringUTFChars(source, srcData);
}

extern "C" void
Java_org_appcelerator_kroll_runtime_v8_V8Runtime_destroy(JNIEnv *env, jclass clazz)
{
	context.Dispose();
}

extern "C" jint
JNI_OnLoad(JavaVM *vm, void *reserved)
{
	JNIEnv *env;
	javaVm = vm;

	if (vm->GetEnv((void **) &env, JNI_VERSION_1_4))
	{
		return JNI_ERR;
	}

	return JNI_VERSION_1_4;
}
