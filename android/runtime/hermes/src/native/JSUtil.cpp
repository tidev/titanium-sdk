/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <cmath>
#include <cstdlib>
#include <limits>

#include "JSUtil.h"
#include "JNIUtil.h"
#include "TiRuntime.h"

#define TAG "JSUtil"
#define EXC_TAG "HermesException"

namespace titanium {

jsi::Value JSUtil::executeString(jsi::Runtime& rt, const std::string& source, const std::string& filename)
{
	return rt.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(source), filename);
}

jsi::Function JSUtil::hostFunction(jsi::Runtime& rt, const char* name, unsigned int argCount,
	jsi::HostFunctionType function)
{
	return jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), argCount,
		std::move(function));
}

void JSUtil::setMethod(jsi::Runtime& rt, const jsi::Object& target, const char* name, unsigned int argCount,
	jsi::HostFunctionType function)
{
	target.setProperty(rt, name, hostFunction(rt, name, argCount, std::move(function)));
}

void JSUtil::reportException(jsi::Runtime& rt, const jsi::JSError& error)
{
	StackFrame frame;
	if (parseFirstFrame(error.getStack(), frame)) {
		LOGE(EXC_TAG, "Exception occurred at %s:%i: %s", frame.file.c_str(), frame.line, error.getMessage().c_str());
	} else {
		LOGE(EXC_TAG, "%s", error.getMessage().c_str());
	}
	if (!error.getStack().empty()) {
		LOGD(EXC_TAG, "%s", error.getStack().c_str());
	}
}

void JSUtil::reportException(const std::exception& error)
{
	LOGE(EXC_TAG, "Native exception: %s", error.what());
}

void JSUtil::openJSErrorDialog(jsi::Runtime& rt, const jsi::JSError& error)
{
	JNIEnv* env = JNIUtil::getJNIEnv();
	if (!env) {
		return;
	}

	// A Java exception that crossed the bridge carries its Java stack in "nativeStack".
	std::string javaStack;
	bool hasJavaStack = false;
	try {
		if (error.value().isObject()) {
			jsi::Value nativeStack = error.value().getObject(rt).getProperty(rt, "nativeStack");
			if (nativeStack.isString()) {
				javaStack = nativeStack.getString(rt).utf8(rt);
				hasJavaStack = true;
			}
		}
	} catch (const std::exception&) {
		// The error object refused the property read. Show the dialog without the Java stack.
	}

	StackFrame frame;
	bool hasFrame = parseFirstFrame(error.getStack(), frame);

	jstring title = env->NewStringUTF("Runtime Error");
	jstring errorMessage = env->NewStringUTF(error.getMessage().c_str());
	jstring resourceName = hasFrame ? env->NewStringUTF(frame.file.c_str()) : NULL;
	// Hermes does not keep the source text, so there is no source line to show.
	jstring sourceLine = NULL;
	jstring jsStackString = error.getStack().empty() ? NULL : env->NewStringUTF(error.getStack().c_str());
	jstring javaStackString = hasJavaStack ? env->NewStringUTF(javaStack.c_str()) : NULL;

	env->CallStaticVoidMethod(
		JNIUtil::krollRuntimeClass,
		JNIUtil::krollRuntimeDispatchExceptionMethod,
		title,
		errorMessage,
		resourceName,
		(jint) frame.line,
		sourceLine,
		(jint) frame.column,
		jsStackString,
		javaStackString);

	env->DeleteLocalRef(title);
	env->DeleteLocalRef(errorMessage);
	if (resourceName) {
		env->DeleteLocalRef(resourceName);
	}
	if (jsStackString) {
		env->DeleteLocalRef(jsStackString);
	}
	if (javaStackString) {
		env->DeleteLocalRef(javaStackString);
	}
}

void JSUtil::handleUncaught(jsi::Runtime& rt, const jsi::JSError& error)
{
	openJSErrorDialog(rt, error);
	reportException(rt, error);
}

bool JSUtil::isArguments(jsi::Runtime& rt, const jsi::Value& value)
{
	if (!value.isObject()) {
		return false;
	}
	jsi::Value result = TiRuntime::state->isArguments.call(rt, value);
	return result.isBool() && result.getBool();
}

bool JSUtil::constructorNameMatches(jsi::Runtime& rt, const jsi::Value& value, const char* name)
{
	if (!value.isObject()) {
		return false;
	}
	jsi::Value result = TiRuntime::state->constructorName.call(rt, value);
	return result.isString() && result.getString(rt).utf8(rt) == name;
}

std::string JSUtil::toUtf8(jsi::Runtime& rt, const jsi::Value& value)
{
	try {
		if (value.isString()) {
			return value.getString(rt).utf8(rt);
		}
		return value.toString(rt).utf8(rt);
	} catch (const std::exception&) {
		return std::string();
	}
}

std::string JSUtil::jsonStringify(jsi::Runtime& rt, const jsi::Value& value)
{
	try {
		jsi::Value result = TiRuntime::state->jsonStringify.call(rt, value);
		if (result.isString()) {
			return result.getString(rt).utf8(rt);
		}
	} catch (const std::exception& e) {
		LOGE(TAG, "JSON.stringify failed: %s", e.what());
	}
	return "ERROR";
}

bool JSUtil::isInt32(const jsi::Value& value)
{
	if (!value.isNumber()) {
		return false;
	}
	double number = value.getNumber();
	if (!(number >= std::numeric_limits<int32_t>::min() && number <= std::numeric_limits<int32_t>::max())) {
		return false;
	}
	// Negative zero is a double in V8 too.
	if (number == 0 && std::signbit(number)) {
		return false;
	}
	return number == (double) (int32_t) number;
}

bool JSUtil::parseFirstFrame(const std::string& stack, StackFrame& frame)
{
	size_t lineStart = 0;
	while (lineStart < stack.size()) {
		size_t lineEnd = stack.find('\n', lineStart);
		if (lineEnd == std::string::npos) {
			lineEnd = stack.size();
		}
		std::string line = stack.substr(lineStart, lineEnd - lineStart);
		lineStart = lineEnd + 1;

		size_t at = line.find("at ");
		if (at == std::string::npos || line.find_first_not_of(" \t") != at) {
			continue;
		}
		// The location is the text in the last pair of parentheses, or the text after "at ".
		std::string location;
		size_t open = line.rfind('(');
		size_t close = line.rfind(')');
		if (open != std::string::npos && close != std::string::npos && close > open) {
			location = line.substr(open + 1, close - open - 1);
		} else {
			location = line.substr(at + 3);
		}
		size_t columnSep = location.rfind(':');
		if (columnSep == std::string::npos || columnSep == 0) {
			continue;
		}
		size_t lineSep = location.rfind(':', columnSep - 1);
		if (lineSep == std::string::npos) {
			continue;
		}
		int lineNumber = atoi(location.substr(lineSep + 1, columnSep - lineSep - 1).c_str());
		int columnNumber = atoi(location.substr(columnSep + 1).c_str());
		if (lineNumber <= 0) {
			continue;
		}
		frame.file = location.substr(0, lineSep);
		frame.line = lineNumber;
		frame.column = columnNumber;
		return true;
	}
	return false;
}

void JSUtil::throwString(jsi::Runtime& rt, const std::string& message)
{
	throw jsi::JSError(rt, jsi::Value(jsi::String::createFromUtf8(rt, message)));
}

} // namespace titanium
