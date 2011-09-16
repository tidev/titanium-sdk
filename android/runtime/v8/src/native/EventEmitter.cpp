/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Original code Copyright 2009 Ryan Dahl <ry@tinyclouds.org>
 */
#include "EventEmitter.h"

namespace titanium {

using namespace v8;

Persistent<FunctionTemplate> EventEmitter::constructorTemplate;

static Persistent<String> eventsSymbol;

void EventEmitter::Initialize(Local<FunctionTemplate> globalTemplate)
{
	HandleScope scope;
	constructorTemplate = Persistent<FunctionTemplate>::New(globalTemplate);
	constructorTemplate->SetClassName(String::NewSymbol("EventEmitter"));
	eventsSymbol = Persistent<String>::New(String::NewSymbol("_events"));
}

}
