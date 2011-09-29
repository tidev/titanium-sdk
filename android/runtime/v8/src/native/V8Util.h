/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef V8_UTIL_H
#define V8_UTIL_H

#include <stdio.h>
#include <v8.h>

#define IMMUTABLE_STRING_LITERAL(string_literal) \
	::titanium::ImmutableAsciiStringLiteral::CreateFromLiteral( \
		string_literal "", sizeof(string_literal) - 1)

#define IMMUTABLE_STRING_LITERAL_FROM_ARRAY(string_literal, length) \
	::titanium::ImmutableAsciiStringLiteral::CreateFromLiteral( \
	string_literal, length)

#define SYMBOL_LITERAL(string_literal) \
	v8::Persistent<v8::String>::New(v8::String::NewSymbol(string_literal ""));

#define DEFINE_CONSTANT(target, constant) \
	(target)->Set(v8::String::NewSymbol(#constant), \
		v8::Integer::New(constant), \
		static_cast<v8::PropertyAttribute>(v8::ReadOnly|v8::DontDelete))

#define DEFINE_METHOD(obj, name, callback) \
	obj->Set(v8::String::NewSymbol(name), \
		v8::FunctionTemplate::New(callback)->GetFunction())

#define DEFINE_TEMPLATE(obj, name, tmpl) \
	obj->Set(v8::String::NewSymbol(name), tmpl->GetFunction())

#define DEFINE_PROTOTYPE_METHOD(templ, name, callback) \
{ \
	v8::Local<v8::Signature> __callback##_SIG = v8::Signature::New(templ); \
	v8::Local<v8::FunctionTemplate> __callback##_TEM = \
	v8::FunctionTemplate::New(callback, v8::Handle<v8::Value>(), \
		__callback##_SIG); \
	templ->PrototypeTemplate()->Set(v8::String::NewSymbol(name), \
		__callback##_TEM); \
}

namespace titanium {

class ImmutableAsciiStringLiteral: public v8::String::ExternalAsciiStringResource
{
public:
	static v8::Handle<v8::String> CreateFromLiteral(const char *stringLiteral, size_t length);

	ImmutableAsciiStringLiteral(const char *src, size_t src_len)
			: buffer_(src), buf_len_(src_len)
	{
	}

	virtual ~ImmutableAsciiStringLiteral()
	{
	}

	const char *data() const
	{
		return buffer_;
	}

	size_t length() const
	{
		return buf_len_;
	}

private:
	const char *buffer_;
	size_t buf_len_;
};

class V8Isolate
{
public:
	V8Isolate()
	{
		if (v8::Isolate::GetCurrent() == NULL)
		{
			v8::Isolate::New()->Enter();
			//v8::internal::Isolate::Current()->InitializeLoggingAndCounters();
		}
	}

	bool IsAlive()
	{
		return !v8::V8::IsExecutionTerminating(v8::Isolate::GetCurrent()) && !v8::V8::IsDead();
	}
};

class V8Util {
public:
	static v8::Handle<v8::Value> executeString(v8::Handle<v8::String> source, v8::Handle<v8::Value> filename);
	static v8::Handle<v8::Value> newInstanceFromConstructorTemplate(v8::Persistent<v8::FunctionTemplate>& t,
		const v8::Arguments& args);
	static void reportException(v8::TryCatch &tryCatch, bool showLine = true);
	static void fatalException(v8::TryCatch &tryCatch);
	static v8::Handle<v8::String> jsonStringify(v8::Handle<v8::Value> value);
};

}

#endif
