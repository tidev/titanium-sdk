/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <string.h>

#include <v8.h>
#include "V8Util.h"
#include "JNIUtil.h"
#include "JSException.h"
#include "AndroidUtil.h"
#include "TypeConverter.h"


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

void V8Util::objectExtend(Handle<Object> dest, Handle<Object> src)
{
	Handle<Array> names = src->GetOwnPropertyNames();
	int length = names->Length();

	for (int i = 0; i < length; ++i) {
		Handle<Value> name = names->Get(i);
		Handle<Value> value = src->Get(name);
		dest->Set(name, value);
	}
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
			String::Utf8Value msg(message->Get());
			int linenum = message->GetLineNumber();
			LOGE(EXC_TAG, "Exception occurred at %s:%i: %s", *filename, linenum, *msg);
		}
	}

	Local<Value> stackTrace = tryCatch.StackTrace();
	String::Utf8Value trace(tryCatch.StackTrace());

	if (trace.length() > 0 && !stackTrace->IsUndefined()) {
		LOGD(EXC_TAG, *trace);
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

void V8Util::openJSErrorDialog(TryCatch &tryCatch)
{
	JNIEnv *env = JNIUtil::getJNIEnv();
	if (!env) {
		return;
	}

	Handle<Message> message = tryCatch.Message();

	jstring title = env->NewStringUTF("Runtime Error");
	jstring errorMessage = TypeConverter::jsValueToJavaString(message->Get());
	jstring resourceName = TypeConverter::jsValueToJavaString(message->GetScriptResourceName());
	jstring sourceLine = TypeConverter::jsValueToJavaString(message->GetSourceLine());

	env->CallStaticVoidMethod(
		JNIUtil::krollRuntimeClass,
		JNIUtil::krollRuntimeDispatchExceptionMethod,
		title,
		errorMessage,
		resourceName,
		message->GetLineNumber(),
		sourceLine,
		message->GetEndColumn());

	env->DeleteLocalRef(title);
	env->DeleteLocalRef(errorMessage);
	env->DeleteLocalRef(resourceName);
	env->DeleteLocalRef(sourceLine);

}

static int uncaughtExceptionCounter = 0;

void V8Util::fatalException(TryCatch &tryCatch)
{
	HandleScope scope;

	// Check if uncaught_exception_counter indicates a recursion
	if (uncaughtExceptionCounter > 0) {
		reportException(tryCatch, true);
		LOGF(TAG, "Double exception fault");
	}
	reportException(tryCatch, true);
}

Handle<String> V8Util::jsonStringify(Handle<Value> value)
{
	HandleScope scope;

	Handle<Object> json = Context::GetCurrent()->Global()->Get(String::New("JSON"))->ToObject();
	Handle<Function> stringify = Handle<Function>::Cast(json->Get(String::New("stringify")));
	Handle<Value> args[] = { value };
	Handle<Value> result = stringify->Call(json, 1, args);
    if (result.IsEmpty()) {
        LOGE(TAG, "!!!! JSON.stringify() result is null/undefined.!!!");
        return String::New("ERROR");
    } else {
        return result->ToString();
    }
}

bool V8Util::constructorNameMatches(Handle<Object> object, const char* name)
{
	HandleScope scope;
	Local<String> constructorName = object->GetConstructorName();
	return strcmp(*String::Utf8Value(constructorName), name) == 0;
}

static Persistent<Function> isNaNFunction;

bool V8Util::isNaN(Handle<Value> value)
{
	HandleScope scope;
	Local<Object> global = Context::GetCurrent()->Global();

	if (isNaNFunction.IsEmpty()) {
		Local<Value> isNaNValue = global->Get(String::NewSymbol("isNaN"));
		isNaNFunction = Persistent<Function>::New(isNaNValue.As<Function> ());
	}

	Handle<Value> args[] = { value };

	return isNaNFunction->Call(global, 1, args)->BooleanValue();

}

void V8Util::dispose()
{
	nameSymbol.Dispose();
	nameSymbol = Persistent<String>();

	messageSymbol.Dispose();
	messageSymbol = Persistent<String>();

	isNaNFunction.Dispose();
	isNaNFunction = Persistent<Function>();
}

}
