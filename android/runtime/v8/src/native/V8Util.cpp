/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <cstring>
#include <sstream>

#include <v8.h>

#include "V8Util.h"
#include "JNIUtil.h"
#include "JSException.h"
#include "AndroidUtil.h"
#include "TypeConverter.h"

namespace titanium {
using namespace v8;

#define TAG "V8Util"

// DEPRECATED: Use v8::String::Utf8Value. Remove in SDK 8.0
Utf8Value::Utf8Value(v8::Local<v8::Value> value) : length_(0), str_(str_st_)
{
	if (value.IsEmpty()) return;

	v8::Local<v8::String> string = value->ToString();
	if (string.IsEmpty()) return;

	// Allocate enough space to include the null terminator
	size_t len = (3 * string->Length()) + 1;
	if (len > sizeof(str_st_)) {
		str_ = static_cast<char*>(malloc(len));
		//CHECK_NE(str_, nullptr);
	}

	const int flags = v8::String::NO_NULL_TERMINATION | v8::String::REPLACE_INVALID_UTF8;
	length_ = string->WriteUtf8(str_, len, 0, flags);
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
		if (!message.IsEmpty()) {
			v8::String::Utf8Value filename(message->GetScriptResourceName());
			v8::String::Utf8Value msg(message->Get());
			int linenum = message->GetLineNumber();
			LOGE(EXC_TAG, "Exception occurred at %s:%i: %s", *filename, linenum, *msg);
		}
	}

	Local<Value> stackTrace = tryCatch.StackTrace();
	v8::String::Utf8Value trace(stackTrace);

	if (trace.length() > 0 && !stackTrace->IsUndefined()) {
		LOGD(EXC_TAG, *trace);
	} else {
		Local<Value> exception = tryCatch.Exception();
		if (exception->IsObject()) {
			Local<Object> exceptionObj = exception.As<Object>();
			Local<Value> message = exceptionObj->Get(messageSymbol.Get(isolate));
			Local<Value> name = exceptionObj->Get(nameSymbol.Get(isolate));

			if (!message->IsUndefined() && !name->IsUndefined()) {
				v8::String::Utf8Value nameValue(name);
				v8::String::Utf8Value messageValue(message);
				LOGE(EXC_TAG, "%s: %s", *nameValue, *messageValue);
			}
		} else {
			v8::String::Utf8Value error(exception);
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

	HandleScope scope(isolate);

	Local<Context> context = isolate->GetCurrentContext();
	Local<Message> message = tryCatch.Message();
	Local<Value> exception = tryCatch.Exception();

	Local<Value> jsStack;
	Local<Value> javaStack;

	// obtain javascript and java stack traces
	if (exception->IsObject()) {
		Local<Object> error = exception.As<Object>();
		jsStack = error->Get(context, STRING_NEW(isolate, "stack")).FromMaybe(Undefined(isolate).As<Value>());
		javaStack = error->Get(context, STRING_NEW(isolate, "nativeStack")).FromMaybe(Undefined(isolate).As<Value>());
	}

	// javascript stack trace not provided? obtain current javascript stack trace
	if (jsStack.IsEmpty() || jsStack->IsNullOrUndefined()) {
		Local<StackTrace> frames = message->GetStackTrace();
		if (frames.IsEmpty() || !frames->GetFrameCount()) {
			frames = StackTrace::CurrentStackTrace(isolate, MAX_STACK);
		}
		if (!frames.IsEmpty()) {
			std::string stackString = V8Util::stackTraceString(frames);
			if (!stackString.empty()) {
				jsStack = String::NewFromUtf8(isolate, stackString.c_str()).As<Value>();
			}
		}
	}

	jstring title = env->NewStringUTF("Runtime Error");
	jstring errorMessage = TypeConverter::jsValueToJavaString(isolate, env, message->Get());
	jstring resourceName = TypeConverter::jsValueToJavaString(isolate, env, message->GetScriptResourceName());
	jstring sourceLine = TypeConverter::jsValueToJavaString(isolate, env, message->GetSourceLine());
	jstring jsStackString = TypeConverter::jsValueToJavaString(isolate, env, jsStack);
	jstring javaStackString = TypeConverter::jsValueToJavaString(isolate, env, javaStack);

	env->CallStaticVoidMethod(
		JNIUtil::krollRuntimeClass,
		JNIUtil::krollRuntimeDispatchExceptionMethod,
		title,
		errorMessage,
		resourceName,
		message->GetLineNumber(),
		sourceLine,
		message->GetEndColumn(),
		jsStackString,
		javaStackString);

	env->DeleteLocalRef(title);
	env->DeleteLocalRef(errorMessage);
	env->DeleteLocalRef(resourceName);
	env->DeleteLocalRef(sourceLine);
	env->DeleteLocalRef(jsStackString);
	env->DeleteLocalRef(javaStackString);
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
	MaybeLocal<Value> result = stringify->Call(context, json, 1, args);
	if (result.IsEmpty()) {
		LOGE(TAG, "!!!! JSON.stringify() result is null/undefined.!!!");
		return scope.Escape(STRING_NEW(isolate, "ERROR"));
	} else {
		return scope.Escape(result.ToLocalChecked().As<String>());
	}
}

bool V8Util::constructorNameMatches(Isolate* isolate, Local<Object> object, const char* name)
{
	HandleScope scope(isolate);
	Local<String> constructorName = object->GetConstructorName();
	return strcmp(*v8::String::Utf8Value(constructorName), name) == 0;
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
	MaybeLocal<Value> result = isNaNFunction.Get(isolate)->Call(context, global, 1, args);
	if (result.IsEmpty()) {
		return false;
	}
	return result.ToLocalChecked()->BooleanValue();
}

void V8Util::dispose()
{
	nameSymbol.Reset();
	messageSymbol.Reset();
	isNaNFunction.Reset();
}

std::string V8Util::stackTraceString(Local<StackTrace> frames) {
	if (frames.IsEmpty()) {
		return std::string();
	}

	std::stringstream stack;

	for (int i = 0, count = frames->GetFrameCount(); i < count; i++) {
		v8::Local<v8::StackFrame> frame = frames->GetFrame(i);

		v8::String::Utf8Value jsFunctionName(frame->GetFunctionName());
		std::string functionName = std::string(*jsFunctionName, jsFunctionName.length());

		v8::String::Utf8Value jsScriptName(frame->GetScriptName());
		std::string scriptName = std::string(*jsScriptName, jsScriptName.length());

		stack << "    at " << functionName << "(" << scriptName << ":" << frame->GetLineNumber() << ":" << frame->GetColumn() << ")" << std::endl;
	}

	return stack.str();
}

}
