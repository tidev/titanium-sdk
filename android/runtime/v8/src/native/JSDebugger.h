/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef JSDEBUGGER_H_
#define JSDEBUGGER_H_

#include <v8.h>
#include <jni.h>

namespace titanium {

class InspectorClient;

class JSDebugger
{
public:
	static void init(JNIEnv*, jobject jsDebugger, v8::Local<v8::Context>);
	static void enable();
	static void disable();
	static void debugBreak();
	static bool isDebuggerActive();
	static void sendCommand(JNIEnv*, jstring command);
	static void receive(v8::Local<v8::String>);
	static v8::Local<v8::String> WaitForMessage();

private:
	JSDebugger();

	static bool enabled__;
	static jclass debuggerClass__;
	static jobject debugger__;
	static jmethodID handleMessage__;
	static jmethodID waitForMessage__;
	static InspectorClient* client__;
	static bool isActive__;
};
}

#endif /* JSDEBUGGER_H_ */
