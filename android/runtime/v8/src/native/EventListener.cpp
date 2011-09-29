/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <stdio.h>
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

static Persistent<String> javaObjectSymbol;

Handle<Value> EventListener::postEvent(const Arguments& args)
{
	HandleScope scope;

	if (args.Length() == 0) {
		return Undefined();
	}

	jobject jEvent = TypeConverter::jsValueToJavaObject(args[0]);
	JavaObject *javaListener = static_cast<JavaObject *>(External::Unwrap(args.Data()));
	jobject listener = javaListener->getJavaObject();

	JNIEnv *env = JNIScope::getEnv();
	if (!env) {
		return JSException::GetJNIEnvironmentError();
	}

	env->CallVoidMethod(listener, JNIUtil::eventListenerPostEventMethod, jEvent);
	return Undefined();
}

}

extern "C" {

using namespace titanium;

jlong Java_org_appcelerator_kroll_runtime_v8_EventListener_nativeInit(JNIEnv *env, jobject listener)
{
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
