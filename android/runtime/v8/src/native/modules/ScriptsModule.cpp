/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <v8.h>
#include <jni.h>

#include "AndroidUtil.h"
#include "NativeObject.h"
#include "ScriptsModule.h"
#include "V8Runtime.h"
#include "V8Util.h"
#include "JNIUtil.h"
#include "TypeConverter.h"
#include "JSException.h"

#define TAG "ScriptsModule"

namespace titanium {
using namespace v8;

Persistent<FunctionTemplate> WrappedScript::constructor_template;
Persistent<ObjectTemplate> WrappedContext::global_template;

void WrappedContext::Initialize(Handle<Object> target)
{
	HandleScope scope;

	global_template = Persistent<ObjectTemplate>::New(ObjectTemplate::New());
	global_template->SetInternalFieldCount(1);
}

WrappedContext* WrappedContext::Unwrap(Handle<Object> global)
{
	HandleScope scope;
	return NativeObject::Unwrap<WrappedContext>(global->GetPrototype().As<Object>());
}

WrappedContext::WrappedContext(Persistent<Context> context)
	: context_(context)
{
	HandleScope scope;

	Local<Object> globalProxy = context->Global();
	Local<Object> global = globalProxy->GetPrototype().As<Object>();
	Wrap(global);
}

WrappedContext::~WrappedContext()
{
	if (!context_.IsEmpty()) {
		context_->DetachGlobal();
		context_.Dispose();
		context_.Clear();
	}
}

Persistent<Context> WrappedContext::GetV8Context()
{
	return context_;
}

void WrappedScript::Initialize(Handle<Object> target)
{
	HandleScope scope;

	constructor_template = Persistent<FunctionTemplate>::New(FunctionTemplate::New(WrappedScript::New));
	constructor_template->InstanceTemplate()->SetInternalFieldCount(1);
	constructor_template->SetClassName(String::NewSymbol("Script"));

	DEFINE_PROTOTYPE_METHOD(constructor_template, "runInContext", WrappedScript::RunInContext);
	DEFINE_PROTOTYPE_METHOD(constructor_template, "runInThisContext", WrappedScript::RunInThisContext);
	DEFINE_PROTOTYPE_METHOD(constructor_template, "runInNewContext", WrappedScript::RunInNewContext);

	DEFINE_METHOD(constructor_template, "createContext", WrappedScript::CreateContext);
	DEFINE_METHOD(constructor_template, "disposeContext", WrappedScript::DisposeContext);
	DEFINE_METHOD(constructor_template, "runInContext", WrappedScript::CompileRunInContext);
	DEFINE_METHOD(constructor_template, "runInThisContext", WrappedScript::CompileRunInThisContext);
	DEFINE_METHOD(constructor_template, "runInNewContext", WrappedScript::CompileRunInNewContext);

	target->Set(String::NewSymbol("Script"), constructor_template->GetFunction());
}

Handle<Value> WrappedScript::New(const Arguments& args)
{
	if (!args.IsConstructCall()) {
		return V8Util::newInstanceFromConstructorTemplate(constructor_template, args);
	}

	HandleScope scope;
	WrappedScript *t = new WrappedScript();
	t->Wrap(args.Holder());
	return WrappedScript::EvalMachine<compileCode, thisContext, wrapExternal>(args);
}

WrappedScript::~WrappedScript()
{
	script_.Dispose();
}

Handle<Value> WrappedScript::CreateContext(const Arguments& args)
{
	HandleScope scope;

	Persistent<Context> context = Context::New(NULL, WrappedContext::global_template);
	WrappedContext *wrappedContext = new WrappedContext(context);
	Local<Object> global = context->Global();

	// Allow current context access to newly created context's objects.
	context->SetSecurityToken(Context::GetCurrent()->GetSecurityToken());

	// If a sandbox is provided initial the new context's global with it.
	if (args.Length() > 0) {
		Local<Object> sandbox = args[0]->ToObject();
		Local<Array> keys = sandbox->GetPropertyNames();

		for (uint32_t i = 0; i < keys->Length(); i++) {
			Handle<String> key = keys->Get(Integer::New(i))->ToString();
			Handle<Value> value = sandbox->Get(key);
			if (value == sandbox) {
				value = global;
			}
			global->Set(key, value);
		}
	}

	return scope.Close(global);
}

Handle<Value> WrappedScript::DisposeContext(const Arguments& args)
{
	HandleScope scope;

	if (args.Length() < 1) {
		return JSException::Error("Must pass the context as the first argument.");
	}

	WrappedContext* wrappedContext = WrappedContext::Unwrap(args[0]->ToObject());
	delete wrappedContext;
}

Handle<Value> WrappedScript::RunInContext(const Arguments& args)
{
	return WrappedScript::EvalMachine<unwrapExternal, userContext, returnResult>(args);
}

Handle<Value> WrappedScript::RunInThisContext(const Arguments& args)
{
	return WrappedScript::EvalMachine<unwrapExternal, thisContext, returnResult>(args);
}

Handle<Value> WrappedScript::RunInNewContext(const Arguments& args)
{
	return WrappedScript::EvalMachine<unwrapExternal, newContext, returnResult>(args);
}

Handle<Value> WrappedScript::CompileRunInContext(const Arguments& args)
{
	return WrappedScript::EvalMachine<compileCode, userContext, returnResult>(args);
}

Handle<Value> WrappedScript::CompileRunInThisContext(const Arguments& args)
{
	return WrappedScript::EvalMachine<compileCode, thisContext, returnResult>(args);
}

Handle<Value> WrappedScript::CompileRunInNewContext(const Arguments& args)
{
	return WrappedScript::EvalMachine<compileCode, newContext, returnResult>(args);
}

template<WrappedScript::EvalInputFlags input_flag, WrappedScript::EvalContextFlags context_flag,
	WrappedScript::EvalOutputFlags output_flag>
Handle<Value> WrappedScript::EvalMachine(const Arguments& args)
{
	HandleScope scope;

	if (input_flag == compileCode && args.Length() < 1) {
		return ThrowException(Exception::TypeError(String::New("needs at least 'code' argument.")));
	}

	const int sandbox_index = input_flag == compileCode ? 1 : 0;
	if (context_flag == userContext && args.Length() < (sandbox_index + 1)) {
		return ThrowException(Exception::TypeError(String::New("needs a 'context' argument.")));
	}

	Local<String> code;
	if (input_flag == compileCode) code = args[0]->ToString();

	Local<Object> sandbox;
	if (context_flag == newContext) {
		sandbox = args[sandbox_index]->IsObject() ? args[sandbox_index]->ToObject() : Object::New();
	} else if (context_flag == userContext) {
		sandbox = args[sandbox_index]->ToObject();
	}

	int filename_offset = 1;
	if (context_flag == thisContext) {
		filename_offset = 0;
	}

	const int filename_index = sandbox_index + filename_offset;
	Local<String> filename =
		args.Length() > filename_index ? args[filename_index]->ToString() : String::New("evalmachine.<anonymous>");

	const int display_error_index = args.Length() - 1;
	bool display_error = false;
	if (args.Length() > display_error_index && args[display_error_index]->IsBoolean()
		&& args[display_error_index]->BooleanValue() == true) {
		display_error = true;
	}

	Persistent<Context> context;

	Local<Array> keys;
	unsigned int i;
	WrappedContext *nContext = NULL;
	Local<Object> contextArg;

	if (context_flag == newContext) {
		// Create the new context
		context = Context::New();

	} else if (context_flag == userContext) {
		// Use the passed in context
		contextArg = args[sandbox_index]->ToObject();
		nContext = WrappedContext::Unwrap(contextArg);
		context = nContext->GetV8Context();
	}

	// New and user context share code. DRY it up.
	if (context_flag == userContext || context_flag == newContext) {
		// Enter the context
		context->Enter();
	}

	Handle<Value> result;
	Handle<Script> script;

	if (input_flag == compileCode) {
		// well, here WrappedScript::New would suffice in all cases, but maybe
		// Compile has a little better performance where possible
		script = output_flag == returnResult ? Script::Compile(code, filename) : Script::New(code, filename);
		if (script.IsEmpty()) {
			// Hack because I can't get a proper stacktrace on SyntaxError
			return Undefined();
		}
	} else {
		WrappedScript *n_script = NativeObject::Unwrap<WrappedScript>(args.Holder());
		if (!n_script) {
			return ThrowException(Exception::Error(String::New("Must be called as a method of Script.")));
		} else if (n_script->script_.IsEmpty()) {
			return ThrowException(Exception::Error(String::New("'this' must be a result of previous "
				"new Script(code) call.")));
		}

		script = n_script->script_;
	}

	if (output_flag == returnResult) {
		result = script->Run();
		if (result.IsEmpty()) {
			if (context_flag == newContext) {
				context->DetachGlobal();
				context->Exit();
				context.Dispose();
			}
			return Undefined();
		}
	} else {
		WrappedScript *n_script = NativeObject::Unwrap<WrappedScript>(args.Holder());
		if (!n_script) {
			return ThrowException(Exception::Error(String::New("Must be called as a method of Script.")));
		}
		n_script->script_ = Persistent<Script>::New(script);
		result = args.This();
	}

	if (context_flag == newContext) {
		// Clean up, clean up, everybody everywhere!
		context->DetachGlobal();
		context->Exit();
		context.Dispose();
	} else if (context_flag == userContext) {
		// Exit the passed in context.
		context->Exit();
	}

	if (result->IsObject()) {
		Local<Context> creation = result->ToObject()->CreationContext();
	}

	return result == args.This() ? result : scope.Close(result);
}

void ScriptsModule::Initialize(Handle<Object> target)
{
	HandleScope scope;
	WrappedContext::Initialize(target);
	WrappedScript::Initialize(target);
}

void ScriptsModule::Dispose()
{
	WrappedScript::constructor_template.Dispose();
	WrappedContext::global_template.Dispose();
}

}
