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
class APIModule
{
public:
	static v8::Handle<v8::Object> init();
	static v8::Handle<v8::Value> logDebug(const v8::Arguments& args);
	static v8::Handle<v8::Value> logInfo(const v8::Arguments& args);
	static v8::Handle<v8::Value> logWarn(const v8::Arguments& args);
	static v8::Handle<v8::Value> logError(const v8::Arguments& args);
	static v8::Handle<v8::Value> logTrace(const v8::Arguments& args);
	static v8::Handle<v8::Value> logNotice(const v8::Arguments& args);
	static v8::Handle<v8::Value> logCritical(const v8::Arguments& args);
	static v8::Handle<v8::Value> logFatal(const v8::Arguments& args);
	static v8::Handle<v8::Value> log(const v8::Arguments& args);


private:
	static void logInternal(int logLevel, const char *messageTag, const char *message);
};
}

#endif

                                                       
