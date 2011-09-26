/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <v8.h>

#include "AndroidUtil.h"
#include "JavaObject.h"
#include "JNIUtil.h"
#include "JSException.h"
#include "NativeObject.h"
#include "TypeConverter.h"
#include "V8Util.h"

#include "EventListener.h"

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

	jobject listener = NativeObject::Unwrap<JavaObject>(args.Data()->ToObject())->getJavaObject();
	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return JSException::GetJNIEnvironmentError();
	}

	env->CallVoidMethod(listener, JNIUtil::eventListenerPostEventMethod, event, arg);

	return Undefined();
}

}

extern "C" {

using namespace titanium;

static Persistent<String> javaObjectSymbol;

jlong Java_org_appcelerator_kroll_runtime_v8_EventListener_nativeInit(JNIEnv *env, jobject listener)
{
	LOGD(TAG, "nativeInit");
	titanium::JNIScope jniScope(env);
	HandleScope scope;

	if (javaObjectSymbol.IsEmpty()) {
		javaObjectSymbol = SYMBOL_LITERAL("javaObject");
	}

	JavaObject *o = new JavaObject(listener);
	Local<FunctionTemplate> eventTemplate = FunctionTemplate::New(EventListener::postEvent, External::Wrap(o));

	Persistent<Function> v8Listener = Persistent<Function>::New(eventTemplate->GetFunction());
	v8Listener->SetHiddenValue(javaObjectSymbol, External::Wrap(o));

	return (jlong) *v8Listener;
}

void Java_org_appcelerator_kroll_runtime_v8_EventListener_nativeDispose(JNIEnv *env, jobject listener, jlong ptr)
{
	LOGD(TAG, "nativeDispose");
	titanium::JNIScope jniScope(env);
	HandleScope scope;

	Persistent<Function> v8Listener = Persistent<Function>::New(Handle<Function>((Function *) ptr));
	JavaObject *o = NativeObject::Unwrap<JavaObject>(v8Listener->GetHiddenValue(javaObjectSymbol)->ToObject());
	if (o) {
		// Cleanup our global ref
		delete o;
	}

	v8Listener.Dispose();
}

}
