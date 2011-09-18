/*
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "ProxyFactory.h"

#include <map>

#include <v8.h>

using namespace std;
using namespace v8;

namespace titanium {

typedef map<jclass, FunctionTemplate*> ProxyFactoryMap;
static ProxyFactoryMap factories;

Handle<Object> ProxyFactory::createV8Proxy(jclass javaClass, jobject javaProxy)
{
	ProxyFactoryMap::iterator i = factories.find(javaClass);
	if (i == factories.end())
		return Handle<Object>();
	FunctionTemplate* v8ProxyTemplate = i->second;

	HandleScope scope;

	Local<Function> creator = v8ProxyTemplate->GetFunction();
	Local<Value> external = External::New(javaProxy);
	Local<Object> v8Proxy = creator->NewInstance(1, &external);

	return scope.Close(v8Proxy);
}

jobject ProxyFactory::createJavaProxy(jclass javaClass, Local<Object> v8Proxy, const Arguments& args)
{
	// TODO: implement
	return NULL;
}

jobject ProxyFactory::unwrapJavaProxy(const Arguments& args)
{
	if (args.Length() != 1)
		return NULL;
	Local<Value> firstArgument = args[0];
	return firstArgument->IsExternal() ? (jobject)External::Unwrap(firstArgument) : NULL;
}

void ProxyFactory::setTemplateForClass(FunctionTemplate* v8ProxyTemplate, jclass javaClass)
{
	factories[javaClass] = v8ProxyTemplate;
}

}

