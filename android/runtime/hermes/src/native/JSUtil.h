/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef JS_UTIL_H
#define JS_UTIL_H

#include <exception>
#include <string>

#include <jsi/jsi.h>

#include "AndroidUtil.h"

namespace titanium {

using namespace facebook;

// The Hermes counterpart of V8Util.
class JSUtil
{
public:
	struct StackFrame {
		std::string file;
		int line = -1;
		int column = -1;
	};

	// Evaluates a script in the global scope. Throws jsi::JSError on a syntax or runtime error.
	static jsi::Value executeString(jsi::Runtime& rt, const std::string& source, const std::string& filename);

	static jsi::Function hostFunction(jsi::Runtime& rt, const char* name, unsigned int argCount,
		jsi::HostFunctionType function);

	// Adds a native function to an object under the given name.
	static void setMethod(jsi::Runtime& rt, const jsi::Object& target, const char* name, unsigned int argCount,
		jsi::HostFunctionType function);

	// Writes the error to the log.
	static void reportException(jsi::Runtime& rt, const jsi::JSError& error);
	static void reportException(const std::exception& error);

	// Shows the error dialog of the app through KrollRuntime.dispatchException().
	static void openJSErrorDialog(jsi::Runtime& rt, const jsi::JSError& error);

	// For an error that reached native code and that no JS code can catch: dialog, then log.
	static void handleUncaught(jsi::Runtime& rt, const jsi::JSError& error);

	static bool isArguments(jsi::Runtime& rt, const jsi::Value& value);
	static bool constructorNameMatches(jsi::Runtime& rt, const jsi::Value& value, const char* name);

	// String(value) as UTF-8. Never throws. Returns an empty string if the conversion fails.
	static std::string toUtf8(jsi::Runtime& rt, const jsi::Value& value);

	static std::string jsonStringify(jsi::Runtime& rt, const jsi::Value& value);

	// True for a number that fits a Java int without loss.
	static bool isInt32(const jsi::Value& value);

	// Reads the first "at name (file:line:column)" line of a Hermes stack trace.
	static bool parseFirstFrame(const std::string& stack, StackFrame& frame);

	// Throws a JS string, like the V8 runtime does for its own argument errors.
	[[noreturn]] static void throwString(jsi::Runtime& rt, const std::string& message);
};

} // namespace titanium

#endif
