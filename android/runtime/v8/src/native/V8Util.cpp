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

Handle<String> ImmutableAsciiStringLiteral::CreateFromLiteral(const char *string_literal, size_t length)
{
	HandleScope scope;
	Local<String> result = String::NewExternal(new ImmutableAsciiStringLiteral(string_literal, length));
	return scope.Close(result);
}

Handle<Value> ExecuteString(Handle<String> source, Handle<Value> filename)
{
	HandleScope scope;
	TryCatch try_catch;

	Local<Script> script = Script::Compile(source, filename);
	if (script.IsEmpty()) {
		LOGF(TAG, "Script source is empty");
		ReportException(try_catch, true);
		return Undefined();
	}

	Local<Value> result = script->Run();
	if (result.IsEmpty()) {
		LOGF(TAG, "Script result is empty");
		ReportException(try_catch, true);
		return Undefined();
	}

	return scope.Close(result);
}

Handle<Value> NewInstanceFromConstructorTemplate(Persistent<FunctionTemplate>& t, const Arguments& args)
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

void ReportException(TryCatch &try_catch, bool show_line)
{
	HandleScope scope;
	Handle<Message> message = try_catch.Message();

	if (show_line) {
		Handle<Message> message = try_catch.Message();
		if (!message.IsEmpty()) {
			String::Utf8Value filename(message->GetScriptResourceName());
			const char* filename_string = *filename;
			int linenum = message->GetLineNumber();
			LOGE("%s:%i\n", filename_string, linenum);
		}
	}

	String::Utf8Value trace(try_catch.StackTrace());
	if (trace.length() > 0 && !try_catch.StackTrace()->IsUndefined()) {
		LOGE("%s\n", *trace);
	} else {
		Local<Value> er = try_catch.Exception();
		bool isErrorObject = er->IsObject() && !(er->ToObject()->Get(String::New("message"))->IsUndefined())
			&& !(er->ToObject()->Get(String::New("name"))->IsUndefined());

		if (isErrorObject) {
			String::Utf8Value name(er->ToObject()->Get(String::New("name")));
			LOGE("%s: ", *name);
		}

		String::Utf8Value msg(
			!isErrorObject ? er->ToString() : er->ToObject()->Get(String::New("message"))->ToString());
		LOGE("%s\n", *msg);
	}
}

static int uncaught_exception_counter = 0;

void FatalException(TryCatch &try_catch)
{
	HandleScope scope;
	// Check if uncaught_exception_counter indicates a recursion
	if (uncaught_exception_counter > 0) {
		ReportException(try_catch, true);
		LOGF(TAG, "Double exception fault");
		JNIUtil::terminateVM();
	}
	ReportException(try_catch, true);
}

}
