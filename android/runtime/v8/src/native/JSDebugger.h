/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef JSDEBUGGER_H_
#define JSDEBUGGER_H_

#include <v8.h>
#include <v8-debug.h>
#include <jni.h>

namespace titanium {
class JSDebugger
{
public:
	static void init(JNIEnv *env, v8::Isolate *isolate, jobject jsDebugger);
	static void processDebugMessages();
	static void enable();
	static void disable();
	static void debugBreak();
	static bool isDebuggerActive();
	static void sendCommand(JNIEnv *env, jbyteArray command, jint length);

private:
	JSDebugger();

	static void MessageHandler(const v8::Debug::Message& message);

	static bool enabled__;
	static jclass debuggerClass__;
	static jobject debugger__;
	static jmethodID handleMessage__;
	static v8::Isolate *isolate__;
	static bool isActive__;
};
}

#endif /* JSDEBUGGER_H_ */
