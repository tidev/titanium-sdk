/**
 * node-ios-device
 * Copyright (c) 2013-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <queue>
#include <thread>
#include "message.h"
#include "mobiledevice.h"
#include "util.h"

namespace node_ios_device {

extern Nan::Persistent<v8::Object> emitter;
extern std::queue<Message*> msgQueue;
extern std::mutex msgQueueMutex;
extern uv_async_t msgQueueUpdate;

void send(const char* event) {
	send(std::string(event), std::string());
}

void send(const char* event, const std::string& data) {
	send(std::string(event), data);
}

void send(const std::string& event) {
	send(event, std::string());
}

void send(const std::string& event, const std::string& data) {
	{
		std::lock_guard<std::mutex> lock(msgQueueMutex);
		msgQueue.push(new Message(event, data));
	}
	uv_async_send(&msgQueueUpdate);
}

/**
 * Emits a debug message.
 */
void debug(const std::string& output) {
	send("debug", output);
}

/**
 * Formats and emits a debug message.
 */
void debug(const char* format, ...) {
	int final_n;
	int n = ::strlen(format) * 2;
	std::string str;
	std::unique_ptr<char[]> formatted;
	va_list ap;
	while(1) {
		formatted.reset(new char[n]);
		::strcpy(&formatted[0], format);
		::va_start(ap, format);
		final_n = ::vsnprintf(&formatted[0], n, format, ap);
		::va_end(ap);
		if (final_n < 0 || final_n >= n) {
			n += ::abs(final_n - n + 1);
		} else {
			break;
		}
	}
	debug(std::string(formatted.get()));
}

/**
 * Converts CFStringRef strings to C strings.
 */
char* cfstring_to_cstr(CFStringRef str) {
	if (str != NULL) {
		// add 1 to make sure there's enough buffer for the utf-8 string and the null character
		CFIndex length = ::CFStringGetLength(str) + 1;
		CFIndex maxSize = ::CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8);
		char* buffer = (char*)::malloc(maxSize);
		if (::CFStringGetCString(str, buffer, maxSize, kCFStringEncodingUTF8)) {
			return buffer;
		}
	}
	return NULL;
}

} // end namespace node_ios_device
