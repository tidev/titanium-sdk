/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <cassert> // for assert
#include <vector> // std::vector
#include <v8-platform.h>
#include <libplatform/libplatform.h> // to pump message loop
#include "InspectorClient.h"
#include "InspectorFrontend.h" // new InspectorFrontend
#include "V8Util.h" // v8::String::Value and DEFINE_METHOD
#include "V8Runtime.h" // V8Runtime::v8_isolate
#include "JSDebugger.h" // JSDebugger::WaitForMessage()

#define TAG "InspectorClient"

namespace titanium {

bindings::BindEntry InspectorClient::bind_entry = {"inspector", Initialize, NULL};

InspectorClient::InspectorClient(v8::Local<v8::Context> context, v8::Platform* platform)
	: platform_(platform)
	, terminated_(false)
	, running_nested_loop_(false)
{
	// FIXME Replace reference to V8Runtime::v8_isolate with isolate_
	isolate_ = V8Runtime::v8_isolate;
	inspector_ = v8_inspector::V8Inspector::create(V8Runtime::v8_isolate, this);
	v8::String::Value contextName(V8Runtime::v8_isolate, STRING_NEW(V8Runtime::v8_isolate, "Titanium Main Context"));
	inspector_->contextCreated(v8_inspector::V8ContextInfo(
			context, kContextGroupId, v8_inspector::StringView(*contextName, contextName.length())));

	// Place a binding for 'inspector' into KrollBindings and have it expose the callAndPauseOnStart method to JS
	KrollBindings::addExternalBinding("inspector", &InspectorClient::bind_entry);
}

void InspectorClient::disconnect()
{
	v8::HandleScope scope(V8Runtime::v8_isolate);
	v8::Local<v8::Context> context = V8Runtime::GlobalContext();
	channel_.reset(nullptr);
	session_.reset(nullptr);
	inspector_.reset(nullptr);
}

void InspectorClient::connect()
{
	v8::HandleScope scope(V8Runtime::v8_isolate);
	v8::Local<v8::Context> context = V8Runtime::GlobalContext();
	channel_.reset(new InspectorFrontend(context));
	session_ = inspector_->connect(1, channel_.get(), v8_inspector::StringView());
}

void InspectorClient::BreakAtStart()
{
	v8::HandleScope scope(V8Runtime::v8_isolate);
	v8::String::Value pauseReason(V8Runtime::v8_isolate, STRING_NEW(V8Runtime::v8_isolate, "PauseOnNextStatement"));
	session_->schedulePauseOnNextStatement(v8_inspector::StringView(*pauseReason, pauseReason.length()), v8_inspector::StringView());
}

void InspectorClient::sendMessage(const v8_inspector::StringView& message_view)
{
	assert(session_ != nullptr);

	session_->dispatchProtocolMessage(message_view);
}

void InspectorClient::runMessageLoopOnPause(int context_group_id)
{
	assert(channel_ != nullptr);
	if (running_nested_loop_) {
		return;
	}

	terminated_ = false;
	running_nested_loop_ = true;
	while (!terminated_) {
		v8::Local<v8::String> message = JSDebugger::WaitForMessage();
		v8::String::Value buffer(V8Runtime::v8_isolate, message);
		v8_inspector::StringView message_view(*buffer, buffer.length());
		sendMessage(message_view);

		while (v8::platform::PumpMessageLoop(platform_, V8Runtime::v8_isolate)) {}
	}

	terminated_ = false;
	running_nested_loop_ = false;
}

void InspectorClient::quitMessageLoopOnPause()
{
	terminated_ = true;
}

void InspectorClient::Initialize(v8::Local<v8::Object> target, v8::Local<v8::Context> context)
{
	v8::Isolate* isolate = context->GetIsolate();
	v8::HandleScope scope(isolate);

	DEFINE_METHOD(isolate, target, "callAndPauseOnStart", CallAndPauseOnStart);
}

void InspectorClient::CallAndPauseOnStart(const v8::FunctionCallbackInfo<v8::Value>& args)
{
	v8::Isolate* isolate = args.GetIsolate();
	v8::Local<v8::Context> context = isolate->GetCurrentContext();
	v8::HandleScope scope(isolate);

	assert(args.Length() >= 2);
	assert(args[0]->IsString());
	assert(args[1]->IsString());

	// Note that this differs from Node's implementation wher ethey expect the first arg to be a pre-compiled function
	// And a variable number of additional arguments to pass to that function.
	// They wrap the source with a function just like Module.wrap for standard code
	// Then compile the function and pass it into this method to schedule a pause and then invoke it.
	// Instead, we pass the app.js source and filename and compile it, schedule a pause and then run it.
	// This does duplicate some existing logic in ScriptModule.cpp for Script.runInThisContext impl
	v8::TryCatch tryCatch(isolate);
	v8::Local<v8::String> source_text = args[0]->ToString(context).FromMaybe(v8::String::Empty(isolate));
	v8::Local<v8::String> filename = args[1]->ToString(context).FromMaybe(v8::String::Empty(isolate));
	v8::ScriptOrigin origin(filename);
	v8::ScriptCompiler::Source source(source_text, origin);

	v8::MaybeLocal<v8::Script> script = v8::ScriptCompiler::Compile(context, &source);
	if (script.IsEmpty()) {
		// Hack because I can't get a proper stacktrace on SyntaxError
		V8Util::fatalException(isolate, tryCatch); // try to throw SyntaxError exception
		args.GetReturnValue().Set(v8::Undefined(isolate));
		return;
	}

	// Calls #BreakAtStart() on inspector client instance, which calls schedulePauseOnNextStatement
	// This basically queues up a pause to happen as soon as we invoke app.js
	JSDebugger::debugBreak();

	v8::MaybeLocal<v8::Value> result = script.ToLocalChecked()->Run(context);
	args.GetReturnValue().Set(result.FromMaybe(v8::Undefined(isolate).As<Value>()));
}

} // namespace titanium
