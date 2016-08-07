/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <assert.h>
#include <sstream>
#include "JSDebugger.h"
#include "JNIUtil.h"
#include "TypeConverter.h"

#include "org_appcelerator_kroll_runtime_v8_JSDebugger.h"

#define TAG "JSDebugger"

namespace titanium {

JSDebugger::JSDebugger()
{
}

void JSDebugger::init(JNIEnv *env, v8::Isolate *isolate, jobject jsDebugger)
{
	isolate__ = isolate;

	debugger__ = env->NewGlobalRef(jsDebugger);

	debuggerClass__ = env->FindClass("org/appcelerator/kroll/runtime/v8/JSDebugger");
	assert(debuggerClass__ != nullptr);

	handleMessage__ = env->GetMethodID(debuggerClass__, "handleMessage", "(Ljava/lang/String;)V");
	assert(handleMessage__ != nullptr);
}

void JSDebugger::enable()
{
	v8::Debug::SetMessageHandler(isolate__, MessageHandler);
	enabled__ = true;
}

void JSDebugger::disable()
{
	enabled__ = false;
	v8::Debug::SetMessageHandler(isolate__, nullptr);
}

void JSDebugger::debugBreak()
{
	v8::Debug::DebugBreak(isolate__);
}

bool JSDebugger::isDebuggerActive()
{
	return isActive__;
}

void JSDebugger::processDebugMessages()
{
	v8::Debug::ProcessDebugMessages(isolate__);
}

void JSDebugger::sendCommand(JNIEnv *env, jbyteArray command, jint length)
{
	auto buf = new jbyte[length];
	env->GetByteArrayRegion(command, 0, length, buf);

	int len = length / sizeof(uint16_t);
	v8::Debug::SendCommand(isolate__, reinterpret_cast<uint16_t*>(buf), len, nullptr);

	delete[] buf;

	isActive__ = true;
}

void JSDebugger::MessageHandler(const v8::Debug::Message& message)
{
	if (debugger__ == nullptr)
	{
		return;
	}

	JNIEnv *env = JNIUtil::getJNIEnv();
	ASSERT(env != NULL);

	auto json = message.GetJSON();
	jstring s = TypeConverter::jsStringToJavaString(env, json);
	env->CallVoidMethod(debugger__, handleMessage__, s);
	env->DeleteLocalRef(s);
}

bool JSDebugger::enabled__ = false;
v8::Isolate* JSDebugger::isolate__ = nullptr;
jobject JSDebugger::debugger__ = nullptr;
jclass JSDebugger::debuggerClass__ = nullptr;
jmethodID JSDebugger::handleMessage__ = nullptr;
bool JSDebugger::isActive__ = false;

} // namespace titanium

#ifdef __cplusplus
extern "C" {
#endif

using namespace titanium;

/*
 * Class:     org_appcelerator_kroll_runtime_v8_JSDebugger
 * Method:    nativeProcessDebugMessages
 * Signature: ()V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_JSDebugger_nativeProcessDebugMessages(JNIEnv *env, jobject self)
{
	JSDebugger::processDebugMessages();
	// TODO Wrap in try/catch and throw up to Java?
}

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
 * Signature: ([BI)V
 */
JNIEXPORT void JNICALL Java_org_appcelerator_kroll_runtime_v8_JSDebugger_nativeSendCommand(JNIEnv *env, jobject self, jbyteArray command, jint length)
{
	JSDebugger::sendCommand(env, command, length);
	// TODO Wrap in try/catch and throw up to Java?
}

#ifdef __cplusplus
}
#endif
