/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifndef INSPECTORCLIENT_H_
#define INSPECTORCLIENT_H_

#include <v8.h>
#include <v8-inspector.h>

#include "KrollBindings.h"
#include "V8Runtime.h"

namespace titanium {

class InspectorClient : public v8_inspector::V8InspectorClient
{
public:
	InspectorClient(v8::Local<v8::Context>, v8::Platform*);

	/**
	 * Connects to the v8 inspector API and generates a session_
	 */
	void connect();

	/**
	 * Disconnects the session_
	 */
	void disconnect();

	/**
	 * Forwards a message down to the v8 inspector API. Response comes back synch in same thread via InspectorFrontend
	 * @param message The inspector protocol message to send down to the API
	 */
	void sendMessage(const v8_inspector::StringView&);

	/**
	 * Called via JSDebugger::debugBreak, from CallAndPauseOnStart
	 * Used to break at beginning of app.js when debugging is on.
	 */
	void BreakAtStart();

	/**
	 * Callback to initialize JS binding. This is where we hang
	 * "callAndPauseOnStart" to expose to JS code in module.js
	 * @param target Target object (module.exports) to hang API off of.
	 * @param context current JS context
	 */
	static void Initialize(v8::Local<v8::Object>, v8::Local<v8::Context>);

    /**
     * Override to specify valid default context.
     */
	v8::Local<v8::Context> ensureDefaultContextInGroup(int contextGroupId) override {
        return V8Runtime::GlobalContext();
    }

private:
	static const int kContextGroupId = 1;
	const int kInspectorClientIndex = v8::Context::kDebugIdIndex + 1;

	void runMessageLoopOnPause(int context_group_id) override;
	void quitMessageLoopOnPause() override;

	static void CallAndPauseOnStart(const v8::FunctionCallbackInfo<v8::Value>& args);

	/**
	 * The native binding entry for the API. Bound as 'inspector'. See module.js
	 */
	static titanium::bindings::BindEntry bind_entry;

	std::unique_ptr<v8_inspector::V8Inspector> inspector_;
	std::unique_ptr<v8_inspector::V8InspectorSession> session_;
	std::unique_ptr<v8_inspector::V8Inspector::Channel> channel_;
	v8::Isolate* isolate_;
	v8::Platform* platform_;
	bool terminated_;
	bool running_nested_loop_;
};

} // namespace titanium
#endif /* INSPECTORCLIENT_H_ */
