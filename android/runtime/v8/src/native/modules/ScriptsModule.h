/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef SCRIPTS_MODULE_H
#define SCRIPTS_MODULE_H

#include <v8.h>
#include "../NativeObject.h"

namespace titanium {

class ScriptsModule
{
public:
	static void Initialize(v8::Handle<v8::Object> target);
	static void Dispose();
};

class WrappedContext: NativeObject
{
public:
	WrappedContext(v8::Persistent<v8::Context> context);
	virtual ~WrappedContext();

	static void Initialize(v8::Handle<v8::Object> target);

	// Unwrap a context from the given global proxy object.
	static WrappedContext* Unwrap(v8::Handle<v8::Object> global);

	v8::Persistent<v8::Context> GetV8Context();

	static v8::Persistent<v8::ObjectTemplate> global_template;

protected:
	v8::Persistent<v8::Context> context_;
};

class WrappedScript: NativeObject
{
public:
	static void Initialize(v8::Handle<v8::Object> target);

	enum EvalInputFlags
	{
		compileCode, unwrapExternal
	};
	enum EvalContextFlags
	{
		thisContext, newContext, userContext
	};
	enum EvalOutputFlags
	{
		returnResult, wrapExternal
	};

	template<EvalInputFlags input_flag, EvalContextFlags context_flag, EvalOutputFlags output_flag>
	static v8::Handle<v8::Value> EvalMachine(const v8::Arguments& args);

	static v8::Persistent<v8::FunctionTemplate> constructor_template;

	static v8::Handle<v8::Value> New(const v8::Arguments& args);
	static v8::Handle<v8::Value> CreateContext(const v8::Arguments& args);
	static v8::Handle<v8::Value> DisposeContext(const v8::Arguments& args);
	static v8::Handle<v8::Value> RunInContext(const v8::Arguments& args);
	static v8::Handle<v8::Value> RunInThisContext(const v8::Arguments& args);
	static v8::Handle<v8::Value> RunInNewContext(const v8::Arguments& args);
	static v8::Handle<v8::Value> CompileRunInContext(const v8::Arguments& args);
	static v8::Handle<v8::Value> CompileRunInThisContext(const v8::Arguments& args);
	static v8::Handle<v8::Value> CompileRunInNewContext(const v8::Arguments& args);

protected:

	WrappedScript()
		: NativeObject()
	{
	}
	virtual ~WrappedScript();

	v8::Persistent<v8::Script> script_;
};

}

#endif
