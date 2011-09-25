/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef EVENT_LISTENER_H
#define EVENT_LISTENER_H

#include <v8.h>

namespace titanium {

class EventListener
{
public:
	static v8::Handle<v8::Value> postEvent(const v8::Arguments& args);
};

}

#endif
