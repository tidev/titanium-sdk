/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2016 by Appcelerator, Inc. All Rights Reserved.
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

Utf8Value::Utf8Value(v8::Local<v8::Value> value)
    : length_(0), str_(str_st_) {
  if (value.IsEmpty())
    return;

  v8::Local<v8::String> string = value.As<String>();
  if (string.IsEmpty())
    return;

  // Allocate enough space to include the null terminator
  size_t len = (3 * string->Length()) + 1;
  if (len > sizeof(str_st_)) {
    str_ = static_cast<char*>(malloc(len));
    //CHECK_NE(str_, nullptr);
  }

  const int flags =
      v8::String::NO_NULL_TERMINATION | v8::String::REPLACE_INVALID_UTF8;
  length_ = string->WriteUtf8(str_, len, 0, flags);
  str_[length_] = '\0';
}


TwoByteValue::TwoByteValue(v8::Local<v8::Value> value)
    : length_(0), str_(str_st_) {
  if (value.IsEmpty())
    return;

  v8::Local<v8::String> string = value.As<String>();
  if (string.IsEmpty())
    return;

  // Allocate enough space to include the null terminator
  size_t len = (string->Length() * sizeof(uint16_t)) + 1;
  if (len > sizeof(str_st_)) {
    str_ = static_cast<uint16_t*>(malloc(len));
    //CHECK_NE(str_, nullptr);
  }

  const int flags =
      v8::String::NO_NULL_TERMINATION | v8::String::REPLACE_INVALID_UTF8;
  length_ = string->Write(str_, 0, len, flags);
  str_[length_] = '\0';
}

Local<Value> V8Util::executeString(Isolate* isolate, Local<String> source, Local<Value> filename)
{
	EscapableHandleScope scope(isolate);
	TryCatch tryCatch(isolate);

	Local<Script> script = Script::Compile(source, filename.As<String>());
	if (script.IsEmpty()) {
		LOGF(TAG, "Script source is empty");
		reportException(isolate, tryCatch, true);
		return scope.Escape(Undefined(isolate));
	}

	Local<Value> result = script->Run();
	if (result.IsEmpty()) {
		LOGF(TAG, "Script result is empty");
		reportException(isolate, tryCatch, true);
		return scope.Escape(Undefined(isolate));
	}

	return scope.Escape(result);
}

Local<Value> V8Util::newInstanceFromConstructorTemplate(Persistent<FunctionTemplate>& t, const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = args.GetIsolate();
	EscapableHandleScope scope(isolate);
	const int argc = args.Length();
	Local<Value>* argv = new Local<Value> [argc];

	for (int i = 0; i < argc; ++i) {
		argv[i] = args[i];
	}

	Local<Object> instance = t.Get(isolate)->GetFunction()->NewInstance(argc, argv);
	delete[] argv;
	return scope.Escape(instance);
}

void V8Util::objectExtend(Local<Object> dest, Local<Object> src)
{
	Local<Array> names = src->GetOwnPropertyNames();
	int length = names->Length();

	for (int i = 0; i < length; ++i) {
		Local<Value> name = names->Get(i);
		Local<Value> value = src->Get(name);
		dest->Set(name, value);
	}
}

#define EXC_TAG "V8Exception"

static Persistent<String> nameSymbol, messageSymbol;

void V8Util::reportException(Isolate* isolate, TryCatch &tryCatch, bool showLine)
{
	HandleScope scope(isolate);
	Local<Message> message = tryCatch.Message();

	if (nameSymbol.IsEmpty()) {
		nameSymbol.Reset(isolate, NEW_SYMBOL(isolate, "name"));
		messageSymbol.Reset(isolate, NEW_SYMBOL(isolate, "message"));
	}

	if (showLine) {
		Local<Message> message = tryCatch.Message();
		if (!message.IsEmpty()) {
			titanium::Utf8Value filename(message->GetScriptResourceName());
			titanium::Utf8Value msg(message->Get());
			int linenum = message->GetLineNumber();
			LOGE(EXC_TAG, "Exception occurred at %s:%i: %s", *filename, linenum, *msg);
		}
	}

	Local<Value> stackTrace = tryCatch.StackTrace();
	titanium::Utf8Value trace(tryCatch.StackTrace());

	if (trace.length() > 0 && !stackTrace->IsUndefined()) {
		LOGD(EXC_TAG, *trace);
	} else {
		Local<Value> exception = tryCatch.Exception();
		if (exception->IsObject()) {
			Local<Object> exceptionObj = exception.As<Object>();
			Local<Value> message = exceptionObj->Get(messageSymbol.Get(isolate));
			Local<Value> name = exceptionObj->Get(nameSymbol.Get(isolate));

			if (!message->IsUndefined() && !name->IsUndefined()) {
				titanium::Utf8Value nameValue(name);
				titanium::Utf8Value messageValue(message);
				LOGE(EXC_TAG, "%s: %s", *nameValue, *messageValue);
			}
		} else {
			titanium::Utf8Value error(exception);
			LOGE(EXC_TAG, *error);
		}
	}
}

void V8Util::openJSErrorDialog(Isolate* isolate, TryCatch &tryCatch)
{
	JNIEnv *env = JNIUtil::getJNIEnv();
	if (!env) {
		return;
	}

	Local<Message> message = tryCatch.Message();

	jstring title = env->NewStringUTF("Runtime Error");
	jstring errorMessage = TypeConverter::jsValueToJavaString(isolate, env, message->Get());
	jstring resourceName = TypeConverter::jsValueToJavaString(isolate, env, message->GetScriptResourceName());
	jstring sourceLine = TypeConverter::jsValueToJavaString(isolate, env, message->GetSourceLine());

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

void V8Util::fatalException(Isolate* isolate, TryCatch &tryCatch)
{
	HandleScope scope(isolate);

	// Check if uncaught_exception_counter indicates a recursion
	if (uncaughtExceptionCounter > 0) {
		reportException(isolate, tryCatch, true);
		LOGF(TAG, "Double exception fault");
	}
	reportException(isolate, tryCatch, true);
}

Local<String> V8Util::jsonStringify(Isolate* isolate, Local<Value> value)
{
	EscapableHandleScope scope(isolate);
	Local<Context> context = isolate->GetCurrentContext();

	Local<Object> json = context->Global()->Get(STRING_NEW(isolate, "JSON")).As<Object>();
	Local<Function> stringify = json->Get(STRING_NEW(isolate, "stringify")).As<Function>();
	Local<Value> args[] = { value };
	Local<Value> result = stringify->Call(context, json, 1, args).ToLocalChecked();
	if (result.IsEmpty()) {
		LOGE(TAG, "!!!! JSON.stringify() result is null/undefined.!!!");
		return scope.Escape(STRING_NEW(isolate, "ERROR"));
	} else {
		return scope.Escape(result.As<String>());
	}
}

bool V8Util::constructorNameMatches(Isolate* isolate, Local<Object> object, const char* name)
{
	HandleScope scope(isolate);
	Local<String> constructorName = object->GetConstructorName();
	return strcmp(*titanium::Utf8Value(constructorName), name) == 0;
}

static Persistent<Function> isNaNFunction;

bool V8Util::isNaN(Isolate* isolate, Local<Value> value)
{
	HandleScope scope(isolate);
	Local<Context> context = isolate->GetCurrentContext();
	Local<Object> global = context->Global();

	if (isNaNFunction.IsEmpty()) {
		Local<Value> isNaNValue = global->Get(NEW_SYMBOL(isolate, "isNaN"));
		isNaNFunction.Reset(isolate, isNaNValue.As<Function>());
	}

	Local<Value> args[] = { value };

	return isNaNFunction.Get(isolate)->Call(context, global, 1, args).ToLocalChecked()->BooleanValue();
}

void V8Util::dispose()
{
	nameSymbol.Reset();
	messageSymbol.Reset();
	isNaNFunction.Reset();
}

}
