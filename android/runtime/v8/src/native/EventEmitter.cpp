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

Persistent<FunctionTemplate> EventEmitter::constructor_template;

static Persistent<String> eventsSymbol;

void EventEmitter::Initialize(Local<FunctionTemplate> global_template)
{
	HandleScope scope;
	constructor_template = Persistent<FunctionTemplate>::New(global_template);
	constructor_template->SetClassName(String::NewSymbol("EventEmitter"));
	eventsSymbol = Persistent<String>::New(String::NewSymbol("_events"));
}

}
