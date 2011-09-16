#include <v8.h>
#include "V8Util.h"

namespace titanium
{

v8::Handle<v8::String> ImmutableAsciiStringLiteral::CreateFromLiteral(
    const char *string_literal, size_t length)
{
  HandleScope scope;
  v8::Local<v8::String> result = v8::String::NewExternal(
		new ImmutableAsciiStringLiteral(string_literal, length));
  return scope.Close(result);
}

}