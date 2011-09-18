/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "JavaObject.h"

namespace titanium {

JavaObject::JavaObject()
	: javaObject_(NULL)
{
}

JavaObject::~JavaObject
{
	if (javaObject)
		DeleteGlobalRef(javaObject);
}

}

