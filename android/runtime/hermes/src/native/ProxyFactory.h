/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef PROXY_FACTORY_H
#define PROXY_FACTORY_H

#include <jni.h>
#include <string>

#include <jsi/jsi.h>

namespace titanium {

using namespace facebook;

class Proxy;

// Titanium is split across two runtime environments: Java and JS.
// Code must be exposed on both sides of the "bridge". To accomplish this
// we create "proxy" objects on both sides.
//
//   JS Proxy  <----> [JSI-JNI bridge] <--> Java Proxy
//
// This factory helps in the construction of this proxy pair.
// The creation can be started on either the JS or Java sides.
class ProxyFactory
{
public:
	// Creates the JS proxy for an existing Java proxy.
	// Returns undefined if the class has no binding or if the constructor fails.
	static jsi::Value createJsProxy(jsi::Runtime& rt, jclass javaClass, jobject javaProxy);
	static jsi::Value createJsProxy(jsi::Runtime& rt, const std::string& className, jobject javaProxy);

	// Creates the Java proxy for a JS proxy that is under construction.
	// "ctorArgs" is the Arguments object of the JS constructor.
	// Returns a local reference. Throws a JS error if the Java constructor fails.
	static jobject createJavaProxy(jsi::Runtime& rt, jclass javaClass, Proxy* proxy, const jsi::Value& ctorArgs);

	// The name of a Java class in the java.lang.Class.getName() form.
	static std::string getJavaClassName(jclass javaClass);

	static void dispose();
};

} // namespace titanium

#endif
