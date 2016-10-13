/**
 * node-ios-device
 * Copyright (c) 2013-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <v8.h>
#include <cerrno>
#include <sstream>
#include "device.h"

namespace node_ios_device {

using namespace v8;

void relayLogMessages(LogRelayInfo* info, const char* buffer) {
	std::string line;

	for (; *buffer; ++buffer) {
		if (*buffer == '\0' || *buffer == '\r' || *buffer == '\n') {
			if (!line.empty()) {
				send(info->eventName, line);
				line.clear();
			}
		} else {
			line += *buffer;
		}
	}

	if (!line.empty()) {
		send(info->eventName, line);
	}
}

/**
 * Constructs the device object.
 */
Device::Device(am_device& dev) : loaded(false), handle(dev), connected(0), syslogRelayInfo(NULL) {
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
Device::~Device() {
	this->disconnect(true);

	auto it = this->logPortRelayInfo.begin();
	while (it != this->logPortRelayInfo.end()) {
		this->stopLogPortRelay(it->first);
		auto next = this->logPortRelayInfo.begin();
		if (next == it) {
			it++;
		} else {
			it = next;
		}
	}

	if (this->syslogRelayInfo) {
		this->stopSyslogRelay();
		delete this->syslogRelayInfo;
		this->syslogRelayInfo = NULL;
	}
}

/**
 * Connects to the device and gets the device info. This should be called
 * immediately after creating a new Device instance. Once it's initialized,
 * check the `loaded` member to make sure that things loaded properly.
 */
void Device::init() {
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
void Device::install(const char* appPath) {
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
			std::stringstream error;
			error << "Failed to transfer app to device (0x" << std::hex << rval << ")";
			throw std::runtime_error(error.str());
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
		std::stringstream error;
		error << "Failed to install app on device (0x" << std::hex << rval << ")";
		throw std::runtime_error(error.str());
	}
}

/**
 * Connects to a port on the iOS device.
 */
void Device::startLogPortRelay(uint32_t port) {
	if (this->logPortRelayInfo.count(port)) {
		debug("Log connection already started");
		return;
	}

	std::stringstream eventName;
	eventName << "LOG_PORT_" << port << "_" << this->props["udid"];
	LogRelayInfo* info = new LogRelayInfo(this, eventName.str(), port);

	int fd = -1;
	unsigned int id = ::AMDeviceGetConnectionID(this->handle);

	debug("Trying to connect to port %d", port);
	if (::USBMuxConnectByPort(id, htons(port), &fd) != 0) {
		::close(fd);
		std::stringstream error;
		error << "Failed to connect to port " << port;
		throw std::runtime_error(error.str());
	}
	debug("Connected");

	CFSocketContext socketCtx = { 0, info, NULL, NULL, NULL };

	info->socket = ::CFSocketCreateWithNative(
		kCFAllocatorDefault,
		fd,
		kCFSocketDataCallBack,
		&Device::logPortRelaySocketCallback,
		&socketCtx
	);

	debug("Creating run loop source");
	info->source = ::CFSocketCreateRunLoopSource(kCFAllocatorDefault, info->socket, 0);
	if (!info->source) {
		delete info;
		throw std::runtime_error("Failed to create socket run loop source");
	}

	debug("Adding run loop source to run loop");
	::CFRunLoopAddSource(runloop, info->source, kCFRunLoopCommonModes);

	// only add the log relay info if things worked
	this->logPortRelayInfo[port] = info;
}

void Device::stopLogPortRelay(uint32_t port) {
	if (this->logPortRelayInfo.count(port)) {
		debug("Stopping log relay for port %d", port);
		delete this->logPortRelayInfo[port];
		this->logPortRelayInfo.erase(port);
	} else {
		debug("Log relay for port %d already stopped", port);
	}
}

/**
 * Called when there are bytes received from the tunnel to the device.
 */
void Device::logPortRelaySocketCallback(CFSocketRef s, CFSocketCallBackType type, CFDataRef address, const void *data, void *info) {
	const char* buffer = (const char*)CFDataGetBytePtr((CFDataRef)data);
	if (*buffer == '\0') {
		// if the buffer is empty, then that means that the app has quit
		LogRelayInfo* lri = (LogRelayInfo*)info;
		std::stringstream port;
		port << lri->port;

		lri->device->stopLogPortRelay(lri->port);

		send("app-quit", port.str());
	} else {
		relayLogMessages((LogRelayInfo*)info, buffer);
	}
}

/**
 * Starts the log relay service and wires up the connection to the run loop.
 */
void Device::startSyslogRelay() {
	if (this->syslogRelayInfo) {
		debug("Syslog connection already started");
		return;
	}

	std::stringstream eventName;
	eventName << "SYSLOG_" << this->props["udid"];
	this->syslogRelayInfo = new LogRelayInfo(this, eventName.str());

	debug("Starting syslog relay");
	this->connect();
	try {
		this->startService(AMSVC_SYSLOG_RELAY, &this->syslogRelayInfo->connection);
	} catch (...) {
		delete this->syslogRelayInfo;
		this->syslogRelayInfo = NULL;
		this->disconnect();
		throw;
	}
	this->disconnect();

	CFSocketContext socketCtx = { 0, this->syslogRelayInfo, NULL, NULL, NULL };

	debug("Creating socket to syslog service");
	this->syslogRelayInfo->socket = ::CFSocketCreateWithNative(kCFAllocatorDefault, this->syslogRelayInfo->connection, kCFSocketDataCallBack, &Device::syslogRelaySocketCallback, &socketCtx);
	if (!this->syslogRelayInfo->socket) {
		delete this->syslogRelayInfo;
		this->syslogRelayInfo = NULL;
		throw std::runtime_error("Failed to create socket");
	}

	debug("Creating run loop source");
	this->syslogRelayInfo->source = ::CFSocketCreateRunLoopSource(kCFAllocatorDefault, this->syslogRelayInfo->socket, 0);
	if (!this->syslogRelayInfo->source) {
		delete this->syslogRelayInfo;
		this->syslogRelayInfo = NULL;
		throw std::runtime_error("Failed to create socket run loop source");
	}

	debug("Adding run loop source to run loop");
	::CFRunLoopAddSource(runloop, this->syslogRelayInfo->source, kCFRunLoopCommonModes);
}

/**
 * Stops the syslog relay.
 */
void Device::stopSyslogRelay() {
	if (this->syslogRelayInfo) {
		debug("Stopping syslog relay");
		delete this->syslogRelayInfo;
		this->syslogRelayInfo = NULL;
	} else {
		debug("Syslog connection already stopped");
	}
}

/**
 * Called when there are bytes received from the log relay socket. Each
 * line of output is sent to the main thread so Node can consume it.
 */
void Device::syslogRelaySocketCallback(CFSocketRef s, CFSocketCallBackType type, CFDataRef address, const void *data, void *info) {
	relayLogMessages((LogRelayInfo*)info, (const char*)CFDataGetBytePtr((CFDataRef)data));
}

/**
 * Connects to the device, pairs with it, and starts a session. We use a
 * connected counter so that we don't connect more than once.
 */
void Device::connect() {
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
			std::stringstream error;
			error << "Failed to connect to device (0x" << std::hex << rval << ")";
			throw std::runtime_error(error.str());
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
			std::stringstream error;
			error << "Device is not paired (0x" << std::hex << rval << ")";
			throw std::runtime_error(error.str());
		}

		// start the session
		debug("Starting session: %s", this->props["udid"].c_str());
		rval = ::AMDeviceStartSession(this->handle);
		if (rval == MDERR_INVALID_ARGUMENT) {
			throw std::runtime_error("Failed to start session: the lockdown connection has not been established");
		} else if (rval == MDERR_DICT_NOT_LOADED) {
			throw std::runtime_error("Failed to start session: load_dict() failed");
		} else if (rval != MDERR_OK) {
			std::stringstream error;
			error << "Failed to start session (0x" << std::hex << rval << ")";
			throw std::runtime_error(error.str());
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
void Device::disconnect(const bool force) {
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
void Device::startService(const char* serviceName, service_conn_t* conn) {
	debug("Starting \'%s\' service: %s", serviceName, this->props["udid"].c_str());
	mach_error_t rval = ::AMDeviceStartService(this->handle, ::CFStringCreateWithCStringNoCopy(NULL, serviceName, kCFStringEncodingUTF8, NULL), conn, NULL);
	std::stringstream error;
	if (rval == MDERR_SYSCALL) {
		error << "Failed to start \"" << serviceName << "\" service due to system call error (0x" << std::hex << rval << ")";
		throw std::runtime_error(error.str());
	} else if (rval == MDERR_INVALID_ARGUMENT) {
		error << "Failed to start \"" << serviceName << "\" service due to invalid argument (0x" << std::hex << rval << ")";
		throw std::runtime_error(error.str());
	} else if (rval != MDERR_OK) {
		error << "Failed to start \"" << serviceName << "\" service (0x" << std::hex << rval << ")";
		throw std::runtime_error(error.str());
	}
}

/**
 * Sets a property.
 */
void Device::set(const char* key, CFStringRef id) {
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

} // end namespace node_ios_device
