/**
 * node-ios-device
 * Copyright (c) 2013-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef __DEVICE_H__
#define __DEVICE_H__

#include <v8.h>
#include <boost/format.hpp>
#include <map>
#include "mobiledevice.h"
#include "util.h"

using namespace v8;

namespace node_ios_device {

extern CFRunLoopRef runloop;

/**
 * A struct to track log relay stuff.
 */
struct LogRelay {
	service_conn_t     connection;
	CFSocketRef        socket;
	CFRunLoopSourceRef source;

	LogRelay() : socket(NULL), source(NULL) {}

	~LogRelay() {
		if (this->socket) {
			::CFRelease(this->socket);
			this->socket = NULL;
		}

		if (this->source) {
			debug("Removing run loop source from run loop");
			::CFRunLoopRemoveSource(runloop, this->source, kCFRunLoopCommonModes);

			::CFRelease(this->source);
			this->source = NULL;
		}
		::close(this->connection);
	}
};

/**
 * Device object that persists while the device is plugged in. It contains the
 * original MobileDevice device reference and a V8 JavaScript object containing
 * the devices properties.
 */
class Device {
public:
	CFStringRef udid;
	bool        loaded;
	std::map<std::string, std::string> props;

private:
	am_device   handle;
	int         connected;
	LogRelay*   log;

public:
	/**
	 * Constructs the device object.
	 */
	Device(am_device& dev) : loaded(false), handle(dev), connected(0), log(NULL) {
		this->udid = AMDeviceCopyDeviceIdentifier(dev);

		char* str = cfstring_to_cstr(this->udid);
		if (str == NULL) {
			throw std::runtime_error("Unable to read device UDID");
		}

		this->props["udid"] = std::string(str);
		free(str);
	}

	/**
	 * Disconnects and cleans up allocated memory.
	 */
	~Device() {
		this->disconnect(true);

		if (this->log) {
			delete this->log;
			this->log = NULL;
		}
	}

	/**
	 * Connects to the device and gets the device info. This should be called
	 * immediately after creating a new Device instance. Once it's initialized,
	 * check the `loaded` member to make sure that things loaded properly.
	 */
	void init() {
		debug("Getting device info: %s", this->props["udid"].c_str());

		// connect to the device and get its information
		this->connect();

		this->set("name",            CFSTR("DeviceName"));
		this->set("buildVersion",    CFSTR("BuildVersion"));
		this->set("cpuArchitecture", CFSTR("CPUArchitecture"));
		this->set("deviceClass",     CFSTR("DeviceClass"));
		this->set("deviceColor",     CFSTR("DeviceColor"));
		this->set("hardwareModel",   CFSTR("HardwareModel"));
		this->set("modelNumber",     CFSTR("ModelNumber"));
		this->set("productType",     CFSTR("ProductType"));
		this->set("productVersion",  CFSTR("ProductVersion"));
		this->set("serialNumber",    CFSTR("SerialNumber"));

		this->disconnect();

		this->loaded = true;
	}

	/**
	 * Installs the specified app on the device.
	 */
	void install(const char* appPath) {
		// get the path to the app
		CFStringRef appPathStr = ::CFStringCreateWithCString(NULL, appPath, kCFStringEncodingUTF8);
		CFURLRef relativeUrl = ::CFURLCreateWithFileSystemPath(NULL, appPathStr, kCFURLPOSIXPathStyle, false);
		CFURLRef localUrl = ::CFURLCopyAbsoluteURL(relativeUrl);
		::CFRelease(appPathStr);
		::CFRelease(relativeUrl);

		CFStringRef keys[] = { CFSTR("PackageType") };
		CFStringRef values[] = { CFSTR("Developer") };
		CFDictionaryRef options = CFDictionaryCreate(NULL, (const void **)&keys, (const void **)&values, 1, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);

		this->connect();

		// copy .app to device
		debug("Transferring app to device: %s", this->props["udid"].c_str());
		mach_error_t rval = ::AMDeviceSecureTransferPath(0, this->handle, localUrl, options, NULL, 0);
		if (rval != MDERR_OK) {
			::CFRelease(options);
			::CFRelease(localUrl);
			this->disconnect();
			if (rval == -402653177) {
				throw std::runtime_error("Failed to copy app to device: can't install app that contains symlinks");
			} else {
				throw std::runtime_error((boost::format("Failed to transfer app to device (0x%x)") % rval).str());
			}
		}

		// install package on device
		debug("Installing app on device: %s", this->props["udid"].c_str());
		rval = ::AMDeviceSecureInstallApplication(0, this->handle, localUrl, options, NULL, 0);
		::CFRelease(options);
		::CFRelease(localUrl);
		this->disconnect();

		if (rval == -402620395) {
			throw std::runtime_error("Failed to install app on device: most likely a provisioning profile issue");
		} else if (rval != MDERR_OK) {
			throw std::runtime_error((boost::format("Failed to install app on device (0x%x)") % rval).str());
		}
	}

	/**
	 * Starts the log relay service and wires up the connection to the run loop.
	 */
	void startLogRelay() {
		if (this->log) {
			debug("Log connection already started");
			return;
		}

		debug("Starting log relay");
		this->log = new LogRelay();

		this->connect();
		try {
			this->startService(AMSVC_SYSLOG_RELAY, &this->log->connection);
		} catch (...) {
			delete this->log;
			this->log = NULL;
			this->disconnect();
			throw;
		}
		this->disconnect();

		CFSocketContext socketCtx = { 0, this, NULL, NULL, NULL };

		debug("Creating socket to syslog service");
		this->log->socket = ::CFSocketCreateWithNative(kCFAllocatorDefault, this->log->connection, kCFSocketDataCallBack, &Device::logSocketCallback, &socketCtx);
		if (!this->log->socket) {
			delete this->log;
			this->log = NULL;
			throw std::runtime_error("Failed to create socket");
		}

		debug("Creating run loop source");
		this->log->source = ::CFSocketCreateRunLoopSource(kCFAllocatorDefault, this->log->socket, 0);
		if (!this->log->source) {
			delete this->log;
			this->log = NULL;
			throw std::runtime_error("Failed to create socket run loop source");
		}

		debug("Adding run loop source to run loop");
		::CFRunLoopAddSource(runloop, this->log->source, kCFRunLoopCommonModes);
	}

	/**
	 * Stops the log relay.
	 */
	void stopLogRelay() {
		debug("Stopping log relay");
		if (!this->log) {
			debug("Log connection already stopped");
			return;
		}

		delete this->log;
		this->log = NULL;
	}

	/**
	 * Called when there are bytes received from the log relay socket. Each
	 * line of output is sent to the main thread so Node can consume it.
	 */
	static void logSocketCallback(CFSocketRef s, CFSocketCallBackType type, CFDataRef address, const void *data, void *info) {
		std::string* udid = &((Device*)info)->props["udid"];
		std::string line;
		const char* buffer = (const char*)CFDataGetBytePtr((CFDataRef)data);

		for (; *buffer; ++buffer) {
			if (*buffer == '\0' || *buffer == '\n') {
				if (!line.empty()) {
					send(*udid, line);
					line.clear();
				}
			} else {
				line += *buffer;
			}
		}
	}

private:
	/**
	 * Connects to the device, pairs with it, and starts a session. We use a
	 * connected counter so that we don't connect more than once.
	 */
	void connect() {
		if (this->connected < 0) {
			this->connected = 0;
		}
		if (this->connected++ > 0) {
			debug("Already connected");
			// already connected
			return;
		}

		try {
			// connect to the device
			debug("Connecting to device: %s", this->props["udid"].c_str());
			mach_error_t rval = ::AMDeviceConnect(this->handle);
			if (rval == MDERR_SYSCALL) {
				throw std::runtime_error("Failed to connect to device: setsockopt() failed");
			} else if (rval == MDERR_QUERY_FAILED) {
				throw std::runtime_error("Failed to connect to device: the daemon query failed");
			} else if (rval == MDERR_INVALID_ARGUMENT) {
				throw std::runtime_error("Failed to connect to device: invalid argument, USBMuxConnectByPort returned 0xffffffff");
			} else if (rval != MDERR_OK) {
				throw std::runtime_error((boost::format("Failed to connect to device (0x%x)") % rval).str());
			}

			// if we're not paired, go ahead and pair now
			debug("Pairing device: %s", this->props["udid"].c_str());
			if (::AMDeviceIsPaired(this->handle) != 1 && ::AMDevicePair(this->handle) != 1) {
				throw std::runtime_error("Failed to pair device");
			}

			// double check the pairing
			debug("Validating device pairing");
			rval = ::AMDeviceValidatePairing(this->handle);
			if (rval == MDERR_INVALID_ARGUMENT) {
				throw std::runtime_error("Device is not paired: the device is null");
			} else if (rval == MDERR_DICT_NOT_LOADED) {
				throw std::runtime_error("Device is not paired: load_dict() failed");
			} else if (rval != MDERR_OK) {
				throw std::runtime_error((boost::format("Device is not paired (0x%x)") % rval).str());
			}

			// start the session
			debug("Starting session: %s", this->props["udid"].c_str());
			rval = ::AMDeviceStartSession(this->handle);
			if (rval == MDERR_INVALID_ARGUMENT) {
				throw std::runtime_error("Failed to start session: the lockdown connection has not been established");
			} else if (rval == MDERR_DICT_NOT_LOADED) {
				throw std::runtime_error("Failed to start session: load_dict() failed");
			} else if (rval != MDERR_OK) {
				throw std::runtime_error((boost::format("Failed to start session (0x%x)") % rval).str());
			}
		} catch (std::runtime_error& e) {
			this->disconnect();
			throw;
		}
	}

	/**
	 * Disconnects the device if there are no other active connections to this
	 * device. Generally, force should not be set. It's mainly there for the
	 * destructor.
	 */
	void disconnect(const bool force = false) {
		if (this->connected == 0) {
			debug("Already disconnected");
		} else {
			if (force || this->connected == 1) {
				debug("Stopping session: %s", this->props["udid"].c_str());
				::AMDeviceStopSession(this->handle);
				debug("Disconnecting from device: %s", this->props["udid"].c_str());
				::AMDeviceDisconnect(this->handle);
				this->connected = 0;
			} else {
				this->connected--;
			}
		}
	}

	/**
	 * Starts a service.
	 * Note that if the call to AMDeviceStartService() fails, it's probably
	 * because MobileDevice thinks we're connected and paired, but we're not.
	 */
	void startService(const char* serviceName, service_conn_t* conn) {
		debug("Starting \'%s\' service: %s", serviceName, this->props["udid"].c_str());
		mach_error_t rval = ::AMDeviceStartService(this->handle, ::CFStringCreateWithCStringNoCopy(NULL, serviceName, kCFStringEncodingUTF8, NULL), conn, NULL);
		if (rval == MDERR_SYSCALL) {
			throw std::runtime_error((boost::format("Failed to start \"%s\" service due to system call error (0x%x)") % serviceName % rval).str());
		} else if (rval == MDERR_INVALID_ARGUMENT) {
			throw std::runtime_error((boost::format("Failed to start \"%s\" service due to invalid argument (0x%x)") % serviceName % rval).str());
		} else if (rval != MDERR_OK) {
			throw std::runtime_error((boost::format("Failed to start \"%s\" service (0x%x)") % serviceName % rval).str());
		}
	}

	/**
	 * Sets a property.
	 */
	void set(const char* key, CFStringRef id) {
		CFStringRef valueStr = (CFStringRef)::AMDeviceCopyValue(this->handle, 0, id);
		if (valueStr != NULL) {
			char* value = cfstring_to_cstr(valueStr);
			::CFRelease(valueStr);
			if (value != NULL) {
				this->props[key] = std::string(value);
				::free(value);
			}
		}
	}
};

} // end namespace node_ios_device

#endif
