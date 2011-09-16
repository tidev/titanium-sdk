/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef PROXY_FACTORY_TABLE_H
#define PROXY_FACTORY_TABLE_H

#include <jni.h>

#include "ProxyFactory.h"

namespace titanium {
class ProxyFactoryTable
{
public:
	static ProxyFactory * lookup(jclass javaClass);

private:
	// stub out shit here
};
}

#endif

