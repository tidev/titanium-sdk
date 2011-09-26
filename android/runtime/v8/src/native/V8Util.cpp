/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <v8.h>
#include "V8Util.h"
#include "JNIUtil.h"
#include "AndroidUtil.h"

namespace titanium {
using namespace v8;

#define TAG "V8Util"

Handle<String> ImmutableAsciiStringLiteral::CreateFromLiteral(const char *stringLiteral, size_t length)
{
	HandleScope scope;
	Local<String> result = String::NewExternal(new ImmutableAsciiStringLiteral(stringLiteral, length));
	return scope.Close(result);
}

Handle<Value> V8Util::executeString(Handle<String> source, Handle<Value> filename)
{
	HandleScope scope;
	TryCatch tryCatch;

	Local<Script> script = Script::Compile(source, filename);
	if (script.IsEmpty()) {
		LOGF(TAG, "Script source is empty");
		reportException(tryCatch, true);
		return Undefined();
	}

	Local<Value> result = script->Run();
	if (result.IsEmpty()) {
		LOGF(TAG, "Script result is empty");
		reportException(tryCatch, true);
		return Undefined();
	}

	return scope.Close(result);
}

Handle<Value> V8Util::newInstanceFromConstructorTemplate(Persistent<FunctionTemplate>& t, const Arguments& args)
{
	HandleScope scope;
	const int argc = args.Length();
	Local<Value>* argv = new Local<Value> [argc];

	for (int i = 0; i < argc; ++i) {
		argv[i] = args[i];
	}

	Local<Object> instance = t->GetFunction()->NewInstance(argc, argv);
	delete[] argv;
	return scope.Close(instance);
}

#define EXC_TAG "V8Exception"

static Persistent<String> nameSymbol, messageSymbol;

void V8Util::reportException(TryCatch &tryCatch, bool showLine)
{
	HandleScope scope;
	Handle<Message> message = tryCatch.Message();
	if (nameSymbol.IsEmpty()) {
		nameSymbol = SYMBOL_LITERAL("name");
		messageSymbol = SYMBOL_LITERAL("message");
	}

	if (showLine) {
		Handle<Message> message = tryCatch.Message();
		if (!message.IsEmpty()) {
			String::Utf8Value filename(message->GetScriptResourceName());
			int linenum = message->GetLineNumber();
			LOGE(EXC_TAG, "%s:%i", *filename, linenum);
		}
	}

	String::Utf8Value trace(tryCatch.StackTrace());
	if (trace.length() > 0 && !tryCatch.StackTrace()->IsUndefined()) {
		LOGE(EXC_TAG, "%s", *trace);
	} else {
		Local<Value> exception = tryCatch.Exception();
		if (exception->IsObject()) {
			Handle<Object> exceptionObj = exception->ToObject();
			Handle<Value> message = exceptionObj->Get(messageSymbol);
			Handle<Value> name = exceptionObj->Get(nameSymbol);

			if (!message->IsUndefined() && !name->IsUndefined()) {
				String::Utf8Value nameValue(name);
				String::Utf8Value messageValue(message);
				LOGE(EXC_TAG, "%s: %s", *nameValue, *messageValue);
			}
		} else {
			String::Utf8Value error(exception);
			LOGE(EXC_TAG, *error);
		}
	}
}

static int uncaughtExceptionCounter = 0;

void V8Util::fatalException(TryCatch &tryCatch)
{
	HandleScope scope;
	// Check if uncaught_exception_counter indicates a recursion
	if (uncaughtExceptionCounter > 0) {
		reportException(tryCatch, true);
		LOGF(TAG, "Double exception fault");
		JNIUtil::terminateVM();
	}
	reportException(tryCatch, true);
}

void V8Util::logValue(const char *format, Handle<Value> value)
{
	HandleScope scope;

	if (value.IsEmpty()) {
		LOGD(TAG, format, "empty");
	} else if (value->IsObject()) {
		Handle<Object> obj = value->ToObject();
		Handle<Array> names = obj->GetPropertyNames();
		uint32_t length = names->Length();
		LOGD(TAG, format, "{");
		for (uint32_t i = 0; i < length; ++i) {
			Handle<Value> name = names->Get(i);
			Handle<Value> value = obj->GetRealNamedProperty(name->ToString());
			String::Utf8Value nameValue(name->ToString());

			LOGD(TAG, "  \"%s\": ", *nameValue);
			logValue("    \"%s\"", value);
		}
		LOGD(TAG, "}");
	} else {
		String::Utf8Value str(value->ToString());
		LOGD(TAG, format, *str);
	}
}

}
