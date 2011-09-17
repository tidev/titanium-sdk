/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "ProxyFactory.h"

#include <map>

using namespace std;

namespace titanium {

typedef map<jclass, ProxyFactory*> ProxyFactoryMap;
static ProxyFactoryMap factories;

ProxyFactory* ProxyFactory::factoryForClass(jclass javaClass)
{
	// Return the factory for the proxy associated with this
	// Java class. If this Java class has no proxy, return NULL.
	ProxyFactoryMap::iterator i = factories.find(javaClass);
	return (i != factories.end()) ? i->second : NULL;
}

void ProxyFactory::setFactoryForClass(ProxyFactory* factory, jclass javaClass)
{
	factories[javaClass] = factory;
}

}

