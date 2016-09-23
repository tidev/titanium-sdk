/**
 * node-ios-device
 * Copyright (c) 2013-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <nan.h>
#include <node.h>
#include <v8.h>
#include <uv.h>
#include <chrono>
#include <queue>
#include <thread>
#include <boost/format.hpp>
#include "device.h"
#include "message.h"
#include "runloop.h"

#define VALIDATE_STRING_ARG(name, var, idx) \
	if (info.Length() < (idx + 1)) { \
		return Nan::ThrowError(Exception::Error(Nan::New("Missing \'" name "\' argument").ToLocalChecked())); \
	} \
	if (!info[idx]->IsString()) { \
		return Nan::ThrowError(Exception::Error(Nan::New("Expected \'" name "\' argument to be a string").ToLocalChecked())); \
	} \
	v8::Handle<v8::String> var = v8::Handle<v8::String>::Cast(info[idx]); \
	if (var->Length() == 0) { \
		return Nan::ThrowError(Exception::Error(Nan::New("The \'" name "\' must not be an empty string").ToLocalChecked())); \
	}

#define VALIDATE_FUNCTION_ARG(name, var, idx) \
	if (info.Length() < (idx + 1)) { \
		return Nan::ThrowError(Exception::Error(Nan::New("Missing \'" name "\' argument").ToLocalChecked())); \
	} \
	if (!info[idx]->IsFunction()) { \
		return Nan::ThrowError(Exception::Error(Nan::New("Expected \'" name "\' argument to be a function").ToLocalChecked())); \
	} \
	v8::Local<v8::Function> var = v8::Local<v8::Function>::Cast(info[idx]);

#define VALIDATE_UDID_AND_GET_DEVICE(idx) \
	VALIDATE_STRING_ARG("udid", udidHandle, idx) \
	\
	v8::String::Utf8Value udidValue(udidHandle->ToString()); \
	node_ios_device::Device* device = getDevice(*udidValue); \
	\
	flushMessageQueue(); \
	\
	if (device == NULL) { \
		return Nan::ThrowError(Exception::Error(Nan::New((boost::format("Device \'%s\' not connected") % *udidValue).str()).ToLocalChecked())); \
	}

namespace node_ios_device {
	Nan::Persistent<v8::Object> emitter;
	std::queue<node_ios_device::Message*> msgQueue;
	std::mutex msgQueueMutex;
	uv_async_t msgQueueUpdate;
	extern CFMutableDictionaryRef connectedDevices;
	extern std::mutex deviceMutex;
	extern std::timed_mutex initMutex;
}

/**
 * The function signature for libuv's uv_async_cb changed, so this macro wraps
 * the correct signature.
 */
#if NAUV_UVVERSION < 0x000b17
#  define flushMessageQueue() messageQueueCallback(NULL, 0)
#else
#  define flushMessageQueue() messageQueueCallback(NULL)
#endif

/**
 * Async handler when a message has been added to the queue.
 */
static NAUV_WORK_CB(messageQueueCallback) {
	Nan::HandleScope scope;
	v8::Local<v8::Object> ee = Nan::New(node_ios_device::emitter);

	// check that emitter exists
	if (!ee.IsEmpty()) {
		v8::Local<v8::Function> emit = v8::Local<v8::Function>::Cast(ee->Get(Nan::New("emit").ToLocalChecked()));
		v8::Local<v8::Value> args[2];
		node_ios_device::Message* msg;
		std::queue<node_ios_device::Message*> q;

		{
			// lock the message queue and drain it into a local queue
			std::lock_guard<std::mutex> lock(node_ios_device::msgQueueMutex);
			while (!node_ios_device::msgQueue.empty()) {
				q.push(node_ios_device::msgQueue.front());
				node_ios_device::msgQueue.pop();
			}
		}

		// drain the local queue
		while (!q.empty()) {
			msg = q.front();
			q.pop();
			args[0] = Nan::New(msg->event.c_str()).ToLocalChecked();
			args[1] = Nan::New(msg->data.c_str()).ToLocalChecked();
			delete msg;
			emit->Call(ee, 2, args);
		}
	}
}

/**
 * Adds the async handler to Node's run loop if it's not already there.
 */
void startAsyncHandler() {
	if (::uv_is_active((uv_handle_t*)&node_ios_device::msgQueueUpdate) == 0) {
		::uv_async_init(::uv_default_loop(), &node_ios_device::msgQueueUpdate, messageQueueCallback);
	}
}

/**
 * Removes the async handler from Node's run loop so that Node can shutdown.
 */
void stopAsyncHandler() {
	if (::uv_is_active((uv_handle_t*)&node_ios_device::msgQueueUpdate) != 0) {
		::uv_close((uv_handle_t*)&node_ios_device::msgQueueUpdate, NULL);
	}
}

/**
 * Returns the device descriptor for the specified udid or NULL if the device
 * does not exist.
 */
node_ios_device::Device* getDevice(const char* udid) {
	node_ios_device::Device* device = NULL;
	CFStringRef udidStr = ::CFStringCreateWithCString(NULL, udid, kCFStringEncodingUTF8);

	{
		std::lock_guard<std::mutex> lock(node_ios_device::deviceMutex);
		if (::CFDictionaryContainsKey(node_ios_device::connectedDevices, udidStr)) {
			device = (node_ios_device::Device*)::CFDictionaryGetValue(node_ios_device::connectedDevices, udidStr);
		}
	}

	::CFRelease(udidStr);
	return device;
}

/**
 * initialize()
 * Initializes node-ios-device and the event emitter.
 */
NAN_METHOD(initialize) {
	if (info.Length() < 1) {
		return Nan::ThrowError(Exception::Error(Nan::New("Expected 1 argument").ToLocalChecked()));
	}
	if (!info[0]->IsObject()) {
		return Nan::ThrowError(Exception::Error(Nan::New("Argument \'emitter\' must be an object").ToLocalChecked()));
	}

	node_ios_device::emitter.Reset(Local<Object>::Cast(info[0]));
	node_ios_device::debug("Initialized node-ios-device emitter");

	node_ios_device::debug("Starting run loop thread");
	std::thread(node_ios_device::startRunLoop).detach();

	// we need to wait until the run loop has had time to process the initial
	// device notifications, so we first lock the mutex ourselves, then we wait
	// 2 seconds for the run loop will unlock it
	node_ios_device::initMutex.lock();

	// then we try to re-lock it, but we need to wait for the run loop thread
	// to unlock it first
	node_ios_device::initMutex.try_lock_for(std::chrono::seconds(2));

	info.GetReturnValue().SetUndefined();
}

/**
 * devices()
 * Defines a JavaScript function that returns a JavaScript array of iOS devices.
 */
NAN_METHOD(devices) {
	VALIDATE_FUNCTION_ARG("callback", callback, 0)

	v8::Local<v8::Array> result = Nan::New<v8::Array>();
	CFIndex size;
	node_ios_device::Device** values;

	{
		std::lock_guard<std::mutex> lock(node_ios_device::deviceMutex);
		size = ::CFDictionaryGetCount(node_ios_device::connectedDevices);
		values = (node_ios_device::Device**)::malloc(size * sizeof(node_ios_device::Device*));
		::CFDictionaryGetKeysAndValues(node_ios_device::connectedDevices, NULL, (const void **)values);
	}

	node_ios_device::debug("Found %d device%s", size, size == 1 ? "" : "s");

	for (CFIndex i = 0; i < size; i++) {
		if (values[i]->loaded) {
			Local<Object> p = Nan::New<Object>();
			for (std::map<std::string, std::string>::iterator it = values[i]->props.begin(); it != values[i]->props.end(); ++it) {
				Nan::Set(p, Nan::New(it->first).ToLocalChecked(), Nan::New(it->second).ToLocalChecked());
			}
			Nan::Set(result, i, p);
		}
	}

	::free(values);

	// flush message queue
	flushMessageQueue();

	// fire the callback
	v8::Local<v8::Value> args[] = { Nan::Null(), result };
	callback->Call(Nan::GetCurrentContext()->Global(), 2, args);

	info.GetReturnValue().SetUndefined();
}

/**
 * installApp()
 * Defines a JavaScript function that installs an iOS app on the specified device.
 */
NAN_METHOD(installApp) {
	VALIDATE_UDID_AND_GET_DEVICE(0)

	VALIDATE_STRING_ARG("appPath", appPathHandle, 1)
	String::Utf8Value appPathValue(appPathHandle->ToString());

	// check the file exists
	if (::access(*appPathValue, F_OK) != 0) {
		return Nan::ThrowError(Exception::Error(Nan::New((boost::format("The app path \'%s\' does not exist") % *appPathValue).str()).ToLocalChecked()));
	}

	VALIDATE_FUNCTION_ARG("callback", callback, 2)

	try {
		// perform the installation
		device->install(*appPathValue);
	} catch (std::runtime_error& e) {
		return Nan::ThrowError(Exception::Error(Nan::New(e.what()).ToLocalChecked()));
	}

	// flush message queue
	flushMessageQueue();

	// fire the callback
	callback->Call(Nan::GetCurrentContext()->Global(), 0, NULL);

	info.GetReturnValue().SetUndefined();
}

/**
 * startLogRelay()
 * Connects to the device and fires the callback with each line of output from
 * the device's syslog.
 */
NAN_METHOD(startLogRelay) {
	VALIDATE_UDID_AND_GET_DEVICE(0)

	try {
		device->startLogRelay();
	} catch (std::runtime_error& e) {
		return Nan::ThrowError(Exception::Error(Nan::New(e.what()).ToLocalChecked()));
	}

	info.GetReturnValue().SetUndefined();
}

/**
 * stopLogRelay()
 * Stops relaying the device's syslog.
 */
NAN_METHOD(stopLogRelay) {
	VALIDATE_UDID_AND_GET_DEVICE(0)
	device->stopLogRelay();
	info.GetReturnValue().SetUndefined();
}

/**
 * Called when Node begins to shutdown so that we can clean up any allocated memory.
 */
static void cleanup(void *arg) {
	stopAsyncHandler();
	node_ios_device::stopRunLoop();
}

/**
 * resume()
 * Starts the async handler if it's not already. This should be called when you
 * expect messages from the run loop thread.
 */
NAN_METHOD(resume) {
	startAsyncHandler();
	info.GetReturnValue().SetUndefined();
}

/**
 * suspend()
 * Stops the async handler. This should be called when you are no longer
 * expecting any messages from the run loop thread so that Node can properly
 * exit.
 */
NAN_METHOD(suspend) {
	stopAsyncHandler();
	info.GetReturnValue().SetUndefined();
}

/**
 * shutdown()
 * Stops all run loops and releases memory.
 */
NAN_METHOD(shutdown) {
	cleanup(NULL);
	info.GetReturnValue().SetUndefined();
}

/**
 * Wire up the JavaScript functions, initialize the dictionaries, and subscribe
 * to the device notifications.
 */
static void init(Handle<Object> exports) {
	startAsyncHandler();

	exports->Set(Nan::New("initialize").ToLocalChecked(),    Nan::New<FunctionTemplate>(initialize)->GetFunction());
	exports->Set(Nan::New("resume").ToLocalChecked(),        Nan::New<FunctionTemplate>(resume)->GetFunction());
	exports->Set(Nan::New("suspend").ToLocalChecked(),       Nan::New<FunctionTemplate>(suspend)->GetFunction());
	exports->Set(Nan::New("shutdown").ToLocalChecked(),      Nan::New<FunctionTemplate>(shutdown)->GetFunction());
	exports->Set(Nan::New("devices").ToLocalChecked(),       Nan::New<FunctionTemplate>(devices)->GetFunction());
	exports->Set(Nan::New("installApp").ToLocalChecked(),    Nan::New<FunctionTemplate>(installApp)->GetFunction());
	exports->Set(Nan::New("startLogRelay").ToLocalChecked(), Nan::New<FunctionTemplate>(startLogRelay)->GetFunction());
	exports->Set(Nan::New("stopLogRelay").ToLocalChecked(),  Nan::New<FunctionTemplate>(stopLogRelay)->GetFunction());

	node::AtExit(cleanup);
}

NODE_MODULE(node_ios_device, init)
