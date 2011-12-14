/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef API_MODULE_H
#define API_MODULE_H

#include <v8.h>

namespace titanium {
using namespace v8;

class APIModule
{
public:
	static void Initialize(Handle<Object> target);
	static void Dispose();

	static Handle<Value> logDebug(const Arguments& args);
	static Handle<Value> logInfo(const Arguments& args);
	static Handle<Value> logWarn(const Arguments& args);
	static Handle<Value> logError(const Arguments& args);
	static Handle<Value> logTrace(const Arguments& args);
	static Handle<Value> logNotice(const Arguments& args);
	static Handle<Value> logCritical(const Arguments& args);
	static Handle<Value> logFatal(const Arguments& args);
	static Handle<Value> log(const Arguments& args);

	// Only used by debugger for terminating application.
	static Handle<Value> terminate(const Arguments& args);


private:
	static void logInternal(int logLevel, const char *messageTag, const char *message);
	static Persistent<FunctionTemplate> constructorTemplate;
};
}

#endif

                                                       
