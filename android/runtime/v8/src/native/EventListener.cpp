#include <v8.h>

#include "AndroidUtil.h"
#include "EventListener.h"
#include "JavaObject.h"
#include "JSException.h"
#include "NativeObject.h"
#include "TypeConverter.h"

#define TAG "EventListener"

using namespace v8;

namespace titanium {

Handle<Value> EventListener::postEvent(const Arguments& args)
{
	HandleScope scope;

	if (args.Length() == 0) {
		LOGW(TAG, "Called with no arguments");
		return Undefined();
	}

	jstring event = TypeConverter::jsStringToJavaString(args[0]->ToString());
	jobject arg = NULL;
	if (args.Length() > 1) {
		arg = TypeConverter::jsValueToJavaObject(args[1]);
	}

	jobject listener = NativeObject<JavaObject>::Unwrap(args.Data())->getJavaObject();
	JNIEnv *env = JNIUtil::getJNIEnv();
	if (!env) {
		return JSException::GetJNIEnvironmentError();
	}

	env->CallVoidMethod(listener, JNIUtil::eventListenerPostEventMethod, event, arg);

	return Undefined();
}

}

extern "C" {

using namespace titanium;

jlong Java_org_appcelerator_kroll_runtime_v8_EventListener_nativeInit(JNIEnv *env, jobject listener)
{
	HandleScope scope;

	JavaObject *o = new JavaObject(listener);
	Local<FunctionTemplate> eventTemplate = FunctionTemplate::New(EventListener::postEvent, External::Wrap(o));

	return *Persistent<Function>::New(eventTemplate->GetFunction());
}

void Java_org_appcelerator_kroll_runtime_v8_EventListener_nativeDispose(JNIEnv *env, jobject listener, jlong ptr)
{
	HandleScope scope;
	JavaObject *o = (JavaObject *) ptr;

	env->DeleteGlobalRef(o->getJavaObject());
	delete o;
}

}
