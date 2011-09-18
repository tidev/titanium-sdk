/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef JSEXCEPTION_H
#define JSEXCEPTION_H

#include <v8.h>

#define THROW(msg) \
    v8::ThrowException(v8::Exception::Error(v8::String::New(msg)))

namespace titanium {

class JSException
{
public:
    static v8::Handle<v8::Value> CalledConstructor()
    {
        return THROW("Calling this constructor is not allowed.");
    }
};

}

#endif
