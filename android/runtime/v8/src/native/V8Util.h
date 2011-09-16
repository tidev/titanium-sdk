/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef V8_UTIL_H
#define V8_UTIL_H

#include <v8.h>

#define IMMUTABLE_STRING_LITERAL(string_literal)                                \
  ::titanium::ImmutableAsciiStringLiteral::CreateFromLiteral(                   \
      string_literal "", sizeof(string_literal) - 1)
#define IMMUTABLE_STRING_LITERAL_FROM_ARRAY(string_literal, length)             \
  ::titanium::ImmutableAsciiStringLiteral::CreateFromLiteral(                   \
      string_literal, length)

#define SYMBOL_LITERAL(string_literal)											\
	v8::Persistent<v8::String>::New(v8::String::NewSymbol(string_literal ""));

namespace titanium {

using namespace v8;

class ImmutableAsciiStringLiteral: public v8::String::ExternalAsciiStringResource
{
public:
	static v8::Handle<v8::String> CreateFromLiteral(const char *string_literal, size_t length);

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

Handle<Value> ExecuteString(Handle<String> source, Handle<Value> filename);
void ReportException(TryCatch &try_catch, bool show_line);
void FatalException(TryCatch &try_catch);

}

#endif
