/**
 * node-ios-device
 * Copyright (c) 2013-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef __DEVICE_H__
#define __DEVICE_H__

#include <map>
#include "mobiledevice.h"
#include "util.h"

namespace node_ios_device {

extern CFRunLoopRef runloop;

class LogRelayInfo;

/**
 * Device object that persists while the device is plugged in. It contains the
 * original MobileDevice device reference and a V8 JavaScript object containing
 * the devices properties.
 */
class Device {
public:
	CFStringRef   udid;
	bool          loaded;
	std::map<std::string, std::string> props;

private:
	am_device     handle;
	int           connected;
	std::map<uint32_t, LogRelayInfo*> logPortRelayInfo;
	LogRelayInfo* syslogRelayInfo;

public:
	Device(am_device& dev);
	~Device();

	void init();
	void install(const char* appPath);

	void startLogPortRelay(uint32_t port);
	void stopLogPortRelay(uint32_t port);
	static void logPortRelaySocketCallback(CFSocketRef s, CFSocketCallBackType type, CFDataRef address, const void *data, void *info);

	void startSyslogRelay();
	void stopSyslogRelay();
	static void syslogRelaySocketCallback(CFSocketRef s, CFSocketCallBackType type, CFDataRef address, const void *data, void *info);

private:
	void connect();
	void disconnect(const bool force = false);
	void startService(const char* serviceName, service_conn_t* conn);
	void set(const char* key, CFStringRef id);
};

/**
 * A class to track log relay stuff.
 */
class LogRelayInfo {
public:
	Device*            device;
	std::string        eventName;
	uint32_t           port;
	service_conn_t     connection;
	CFSocketRef        socket;
	CFRunLoopSourceRef source;

	LogRelayInfo(Device* _device, std::string _eventName) :
		device(_device), eventName(_eventName), port(0), socket(NULL), source(NULL) {}

	LogRelayInfo(Device* _device, std::string _eventName, uint32_t _port) :
		device(_device), eventName(_eventName), port(_port), socket(NULL), source(NULL) {}

	~LogRelayInfo() {
		if (this->socket) {
			::CFSocketInvalidate(this->socket);
			::CFRelease(this->socket);
			this->socket = NULL;
		}

		if (this->source) {
			::CFRunLoopRemoveSource(runloop, this->source, kCFRunLoopCommonModes);

			::CFRelease(this->source);
			this->source = NULL;
		}

		::close(this->connection);
	}
};

} // end namespace node_ios_device

#endif
