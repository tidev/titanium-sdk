/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Warning: This file is GENERATED, and should not be modified
 */
#include <jni.h>
#include <memory>
#include <string>

#include <jsi/jsi.h>

#include <AndroidUtil.h>
#include <JSException.h>
#include <JSUtil.h>
#include <KrollBindings.h>

#include "BootstrapJS.h"
#include "KrollGeneratedBindings.h"

#define TAG "${moduleId}"

using namespace facebook;

// The exports object of each binding that JS code asked for, by name.
// A JS handle must not outlive the runtime. TiModule_dispose() drops it before the runtime goes.
static std::unique_ptr<jsi::Object> bindingCache;

static jsi::Value TiModule_getBinding(jsi::Runtime& rt, const jsi::Value&, const jsi::Value* args, size_t count)
{
	if (count == 0) {
		titanium::JSException::Error(rt, "${moduleId} TiModule_getBinding() requires 1 argument: binding");
	}

	std::string binding = titanium::JSUtil::toUtf8(rt, args[0]);
	if (!bindingCache) {
		bindingCache.reset(new jsi::Object(rt));
	}

	jsi::PropNameID key = jsi::PropNameID::forUtf8(rt, binding);
	jsi::Value cached = bindingCache->getProperty(rt, key);
	if (cached.isObject()) {
		return cached;
	}

	LOGD(TAG, "Looking up binding: %s", binding.c_str());

	titanium::bindings::BindEntry *extBinding = titanium::bindings::TiModuleBindings::lookupGeneratedInit(
		binding.c_str(), (unsigned int) binding.length());
	if (!extBinding) {
		LOGE(TAG, "Couldn't find binding: %s, returning undefined", binding.c_str());
		return jsi::Value::undefined();
	}

	jsi::Object exports(rt);
	extBinding->bind(rt, exports);
	bindingCache->setProperty(rt, key, exports);
	return exports;
}

static void TiModule_init(jsi::Runtime& rt, const jsi::Object& exports)
{
	for (int i = 0; titanium::natives[i].name; ++i) {
		exports.setProperty(rt, titanium::natives[i].name,
			jsi::String::createFromUtf8(rt, reinterpret_cast<const uint8_t*>(titanium::natives[i].source),
				titanium::natives[i].source_length));
	}

	titanium::JSUtil::setMethod(rt, exports, "getBinding", 1, TiModule_getBinding);
}

static void TiModule_dispose(jsi::Runtime& rt)
{
	if (!bindingCache) {
		return;
	}

	jsi::Array propertyNames = bindingCache->getPropertyNames(rt);
	size_t length = propertyNames.size(rt);
	for (size_t i = 0; i < length; ++i) {
		std::string binding = titanium::JSUtil::toUtf8(rt, propertyNames.getValueAtIndex(rt, i));
		titanium::bindings::BindEntry *extBinding =
			titanium::bindings::TiModuleBindings::lookupGeneratedInit(binding.c_str(), (unsigned int) binding.length());
		if (extBinding && extBinding->dispose) {
			extBinding->dispose(rt);
		}
	}

	bindingCache.reset();
}

static titanium::bindings::BindEntry TiModuleBinding = {
	"${moduleId}",
	TiModule_init,
	TiModule_dispose
};

// Main module entry point
extern "C" JNIEXPORT void JNICALL
Java_${jniPackage}_TiModuleBootstrap_nativeBootstrap
	(JNIEnv *env, jobject self)
{
	titanium::KrollBindings::addExternalBinding("${moduleId}", &TiModuleBinding);
	titanium::KrollBindings::addExternalLookup(&(titanium::bindings::TiModuleBindings::lookupGeneratedInit));
}
