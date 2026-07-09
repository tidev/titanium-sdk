/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <cassert>
#include "InspectorFrontend.h"
#include "JSDebugger.h"
#include "V8Util.h"

#define TAG "InspectorFrontend"

namespace titanium {

InspectorFrontend::InspectorFrontend(v8::Local<v8::Context> context)
{
	isolate_ = context->GetIsolate();
}

void InspectorFrontend::Send(const v8_inspector::StringView& string)
{
	v8::HandleScope scope(isolate_);

	int length = static_cast<int>(string.length());
	assert(length < v8::String::kMaxLength);

	v8::TryCatch tryCatch(isolate_);
	v8::Local<v8::String> message;
	v8::MaybeLocal<v8::String> maybeString =
		(string.is8Bit()
			? v8::String::NewFromOneByte(
					isolate_,
					reinterpret_cast<const uint8_t*>(string.characters8()),
					v8::NewStringType::kNormal, length)
			: v8::String::NewFromTwoByte(
					isolate_,
					reinterpret_cast<const uint16_t*>(string.characters16()),
					v8::NewStringType::kNormal, length));
	if (!maybeString.ToLocal(&message)) {
		V8Util::fatalException(isolate_, tryCatch);
		return;
	}

	JSDebugger::receive(message);
}

} // namespace titanium
