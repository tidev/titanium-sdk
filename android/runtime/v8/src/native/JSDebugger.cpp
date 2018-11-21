/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2016-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <cassert>
#include "JSDebugger.h"
#include "JNIUtil.h" // JNIUtil::getJNIEnv()
#include "TypeConverter.h" // TypeConverter::javaStringToJsString
#include "InspectorClient.h" // new InspectorClient
#include "V8Runtime.h" // V8Runtime::platform and V8Runtime::v8_isolate
#include "V8Util.h" // v8::String::Value

#define TAG "JSDebugger"

namespace titanium {

JSDebugger::JSDebugger()
{
}

void JSDebugger::init(JNIEnv *env, jobject jsDebugger, v8::Local<v8::Context> context)
{
	debugger__ = env->NewGlobalRef(jsDebugger);

	debuggerClass__ = env->FindClass("org/appcelerator/kroll/runtime/v8/JSDebugger");
	assert(debuggerClass__ != nullptr);

	handleMessage__ = env->GetMethodID(debuggerClass__, "handleMessage", "(Ljava/lang/String;)V");
	assert(handleMessage__ != nullptr);

	waitForMessage__ = env->GetMethodID(debuggerClass__, "waitForMessage", "()Ljava/lang/String;");
	assert(waitForMessage__ != nullptr);

	if (debugger__ != nullptr) {
		client__ = new InspectorClient(context, V8Runtime::platform);
	}
}

void JSDebugger::enable()
{
	if (debugger__ == nullptr || enabled__) {
		return;
	}
	client__->connect();
	enabled__ = true;
}

void JSDebugger::disable()
{
	if (debugger__ == nullptr || !enabled__) {
		return;
	}
	enabled__ = false;
	client__->disconnect();
	client__ = nullptr;
}

void JSDebugger::debugBreak()
{
	if (!enabled__) {
		return;
	}

	Isolate::Scope isolate_scope(V8Runtime::v8_isolate);
	v8::HandleScope handleScope(V8Runtime::v8_isolate);
	client__->BreakAtStart();
}

bool JSDebugger::isDebuggerActive()
{
	return isActive__;
}

void JSDebugger::sendCommand(JNIEnv *env, jstring command)
{
	if (!enabled__) {
		return;
	}

	v8::Isolate::Scope isolate_scope(V8Runtime::v8_isolate);
	v8::HandleScope handleScope(V8Runtime::v8_isolate);
	v8::Context::Scope context_scope(V8Runtime::v8_isolate->GetCurrentContext());

	v8::Local<v8::Value> stringValue = TypeConverter::javaStringToJsString(V8Runtime::v8_isolate, env, command);
	v8::Local<v8::String> message = stringValue.As<v8::String>();
	v8::String::Value buffer(V8Runtime::v8_isolate, message);
	v8_inspector::StringView message_view(*buffer, buffer.length());
	client__->sendMessage(message_view);

	isActive__ = true;
}

v8::Local<v8::String> JSDebugger::WaitForMessage()
{
	v8::Isolate::Scope isolate_scope(V8Runtime::v8_isolate);
	v8::EscapableHandleScope handleScope(V8Runtime::v8_isolate);
	v8::Context::Scope context_scope(V8Runtime::v8_isolate->GetCurrentContext());

	if (!enabled__) {
		return v8::String::Empty(V8Runtime::v8_isolate);
	}

	JNIEnv *env = JNIUtil::getJNIEnv();
	ASSERT(env != NULL);

	jstring msg = (jstring) env->CallObjectMethod(debugger__, waitForMessage__, 0);
	v8::Local<v8::Value> stringValue = TypeConverter::javaStringToJsString(V8Runtime::v8_isolate, env, msg);
	env->DeleteLocalRef(msg);

	return handleScope.Escape(stringValue.As<v8::String>());
}

void JSDebugger::receive(v8::Local<v8::String> message)
{
	if (!enabled__) {
		return;
	}

	JNIEnv *env = JNIUtil::getJNIEnv();
	ASSERT(env != NULL);

	jstring s = TypeConverter::jsStringToJavaString(V8Runtime::v8_isolate, env, message);
	env->CallVoidMethod(debugger__, handleMessage__, s);
	env->DeleteLocalRef(s);
}

bool JSDebugger::enabled__ = false;
jobject JSDebugger::debugger__ = nullptr;
jclass JSDebugger::debuggerClass__ = nullptr;
jmethodID JSDebugger::handleMessage__ = nullptr;
jmethodID JSDebugger::waitForMessage__ = nullptr;
InspectorClient* JSDebugger::client__ = nullptr;
bool JSDebugger::isActive__ = false;

} // namespace titanium

extern "C" {

using namespace titanium;

/*
 * Class:     org_appcelerator_kroll_runtime_v8_JSDebugger
 * Method:    nativeEnable
 * Signature: ()V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_JSDebugger_nativeEnable(JNIEnv *env, jobject self)
{
	JSDebugger::enable();
	// TODO Wrap in try/catch and throw up to Java?
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_JSDebugger
 * Method:    nativeDisable
 * Signature: ()V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_JSDebugger_nativeDisable(JNIEnv *env, jobject self)
{
	JSDebugger::disable();
	// TODO Wrap in try/catch and throw up to Java?
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_JSDebugger
 * Method:    nativeDebugBreak
 * Signature: ()V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_JSDebugger_nativeDebugBreak(JNIEnv *env, jobject self)
{
	JSDebugger::debugBreak();
	// TODO Wrap in try/catch and throw up to Java?
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_JSDebugger
 * Method:    nativeIsDebuggerActive
 * Signature: ()Z
 */
JNIEXPORT jboolean JNICALL Java_org_appcelerator_kroll_runtime_v8_JSDebugger_nativeIsDebuggerActive(JNIEnv *env, jobject self)
{
	return (jboolean) JSDebugger::isDebuggerActive();
	// TODO Wrap in try/catch and throw up to Java?
}

/*
 * Class:     org_appcelerator_kroll_runtime_v8_JSDebugger
 * Method:    nativeSendCommand
 * Signature: (Ljava/lang/String;)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_JSDebugger_nativeSendCommand(JNIEnv *env, jobject self, jstring command)
{
	JSDebugger::sendCommand(env, command);
	// TODO Wrap in try/catch and throw up to Java?
}

} // extern "C"
