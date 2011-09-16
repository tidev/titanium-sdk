/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef PROXY_FACTORY_TABLE_H
#define PROXY_FACTORY_TABLE_H

#include <jni.h>

namespace titanium {

class ProxyFactory;

class ProxyFactoryTable
{
public:
	static ProxyFactory* lookup(jclass javaClass);
	static void registerForClass(const char* className, ProxyFactory* factory);
};

}

#endif
