/**
 * node-ios-device
 * Copyright (c) 2013-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include <nan.h>
#include <node.h>
#include <v8.h>
#include <stdlib.h>
#include "mobiledevice.h"

using namespace v8;

/*
 * A struct to track listener properties such as the JavaScript callback
 * function.
 */
typedef struct Listener {
	Nan::Persistent<Function> callback;
} Listener;

/*
 * Globals
 */
static CFMutableDictionaryRef listeners;
static CFMutableDictionaryRef connected_devices;
static bool devices_changed;

/*
 * Converts CFStringRef strings to C strings.
 */
char* cfstring_to_cstr(CFStringRef str) {
	if (str != NULL) {
		// add 1 to make sure there's enough buffer for the utf-8 string and the null character
		CFIndex length = CFStringGetLength(str) + 1;
		CFIndex maxSize = CFStringGetMaximumSizeForEncoding(length, kCFStringEncodingUTF8);
		char* buffer = (char*)malloc(maxSize);
		if (CFStringGetCString(str, buffer, maxSize, kCFStringEncodingUTF8)) {
			return buffer;
		}
	}
	return NULL;
}

/*
 * Device object that persists while the device is plugged in. It contains the
 * original MobileDevice device reference and a V8 JavaScript object containing
 * the devices properties.
 */
class Device {
public:
	am_device device;
	Nan::Persistent<Object> props;
	bool connected;

	service_conn_t logConnection;
	CFSocketRef logSocket;
	CFRunLoopSourceRef logSource;
	Listener* logCallback;

	Device(am_device& dev) : device(dev), connected(false), logSocket(NULL), logSource(NULL), logCallback(NULL) {
		props.Reset(Nan::New<Object>());
	}

	// fetches info from the device and populates the JavaScript object
	void populate(CFStringRef udid) {
		Local<Object> p = Nan::New<Object>();

		char* str = cfstring_to_cstr(udid);
		if (str != NULL) {
			Nan::Set(p, Nan::New("udid").ToLocalChecked(), Nan::New(str).ToLocalChecked());
			free(str);
		}

		this->getProp(p, "name",            CFSTR("DeviceName"));
		this->getProp(p, "buildVersion",    CFSTR("BuildVersion"));
		this->getProp(p, "cpuArchitecture", CFSTR("CPUArchitecture"));
		this->getProp(p, "deviceClass",     CFSTR("DeviceClass"));
		this->getProp(p, "deviceColor",     CFSTR("DeviceColor"));
		this->getProp(p, "hardwareModel",   CFSTR("HardwareModel"));
		this->getProp(p, "modelNumber",     CFSTR("ModelNumber"));
		this->getProp(p, "productType",     CFSTR("ProductType"));
		this->getProp(p, "productVersion",  CFSTR("ProductVersion"));
		this->getProp(p, "serialNumber",    CFSTR("SerialNumber"));

		props.Reset(p);
	}

private:
	void getProp(Local<Object>& p, const char* propName, CFStringRef name) {
		CFStringRef value = AMDeviceCopyValue(this->device, 0, name);
		if (value != NULL) {
			char* str = cfstring_to_cstr(value);
			CFRelease(value);
			if (str != NULL) {
				Nan::Set(p, Nan::New(propName).ToLocalChecked(), Nan::New(str).ToLocalChecked());
				free(str);
			}
		}
	}
};

/*
 * on()
 * Defines a JavaScript function that adds an event listener.
 */
NAN_METHOD(on) {
	if (info.Length() >= 2) {
		if (!info[0]->IsString()) {
			return Nan::ThrowError(Exception::Error(Nan::New("Argument \'event\' must be a string").ToLocalChecked()));
		}

		if (!info[1]->IsFunction()) {
			return Nan::ThrowError(Exception::Error(Nan::New("Argument \'callback\' must be a function").ToLocalChecked()));
		}

		Handle<String> event = Handle<String>::Cast(info[0]);
		String::Utf8Value str(event->ToString());
		CFStringRef eventName = CFStringCreateWithCString(NULL, (char*)*str, kCFStringEncodingUTF8);

		Listener* listener = new Listener;
		listener->callback.Reset(Local<Function>::Cast(info[1]));
		CFDictionarySetValue(listeners, eventName, listener);
	}

	info.GetReturnValue().SetUndefined();
}

/*
 * Notifies all listeners of an event.
 */
void emit(const char* event) {
	CFStringRef eventStr = CFStringCreateWithCStringNoCopy(NULL, event, kCFStringEncodingUTF8, NULL);
	CFIndex size = CFDictionaryGetCount(listeners);
	CFStringRef* keys = (CFStringRef*)malloc(size * sizeof(CFStringRef));
	CFDictionaryGetKeysAndValues(listeners, (const void **)keys, NULL);
	CFIndex i = 0;

	for (; i < size; i++) {
		if (CFStringCompare(keys[i], eventStr, 0) == kCFCompareEqualTo) {
			const Listener* listener = (const Listener*)CFDictionaryGetValue(listeners, keys[i]);
			if (listener != NULL) {
				Local<Function> callback = Nan::New<Function>(listener->callback);
				callback->Call(Nan::GetCurrentContext()->Global(), 0, NULL);
			}
		}
	}

	free(keys);
}

/*
 * pumpRunLoop()
 * Defines a JavaScript function that processes all pending notifications.
 */
NAN_METHOD(pump_run_loop) {
	CFTimeInterval interval = 0.25;

	if (info.Length() > 0 && info[0]->IsNumber()) {
		Local<Number> intervalArg = Local<Number>::Cast(info[0]);
		interval = intervalArg->NumberValue();
	}

	devices_changed = false;

	CFRunLoopRunInMode(kCFRunLoopDefaultMode, interval, false);

	if (devices_changed) {
		emit("devicesChanged");
	}

	info.GetReturnValue().SetUndefined();
}

/*
 * devices()
 * Defines a JavaScript function that returns a JavaScript array of iOS devices.
 * This should be called after pumpRunLoop() has been called.
 */
NAN_METHOD(devices) {
	Local<Array> result = Nan::New<Array>();

	CFIndex size = CFDictionaryGetCount(connected_devices);
	Device** values = (Device**)malloc(size * sizeof(Device*));
	CFDictionaryGetKeysAndValues(connected_devices, NULL, (const void **)values);

	for (CFIndex i = 0; i < size; i++) {
		Nan::Persistent<Object>* obj = &values[i]->props;
		Nan::Set(result, i, Nan::New<Object>(*obj));
	}

	free(values);

	info.GetReturnValue().Set(result);
}

/*
 * The callback when a device notification is received.
 */
void on_device_notification(am_device_notification_callback_info* info, void* arg) {
	CFStringRef udid;

	switch (info->msg) {
		case ADNCI_MSG_CONNECTED:
			udid = AMDeviceCopyDeviceIdentifier(info->dev);
			if (!CFDictionaryContainsKey(connected_devices, udid)) {
				// connect to the device and get its information
				if (AMDeviceConnect(info->dev) == MDERR_OK) {
					if (AMDeviceIsPaired(info->dev) != 1 && AMDevicePair(info->dev) != 1) {
						return;
					}

					if (AMDeviceValidatePairing(info->dev) != MDERR_OK) {
						if (AMDevicePair(info->dev) != 1) {
							return;
						}
						if (AMDeviceValidatePairing(info->dev) != MDERR_OK) {
							return;
						}
					}

					if (AMDeviceStartSession(info->dev) == MDERR_OK) {
						Device* device = new Device(info->dev);
						device->populate(udid);
						CFDictionarySetValue(connected_devices, udid, device);
						devices_changed = true;

						AMDeviceStopSession(info->dev);
					}

					AMDeviceDisconnect(info->dev);
				}
			}
			break;

		case ADNCI_MSG_DISCONNECTED:
			udid = AMDeviceCopyDeviceIdentifier(info->dev);
			if (CFDictionaryContainsKey(connected_devices, udid)) {
				// remove the device from the dictionary and destroy it
				Device* device = (Device*)CFDictionaryGetValue(connected_devices, udid);
				CFDictionaryRemoveValue(connected_devices, udid);

				if (device->logCallback) {
					delete device->logCallback;
				}
				if (device->logSource) {
					CFRelease(device->logSource);
				}
				if (device->logSocket) {
					CFRelease(device->logSocket);
				}

				delete device;
				devices_changed = true;
			}
			break;
	}
}

/*
 * installApp()
 * Defines a JavaScript function that installs an iOS app on the specified device.
 * This should be called after pumpRunLoop() has been called.
 */
NAN_METHOD(installApp) {
	char tmp[256];

	if (info.Length() < 2 || info[0]->IsUndefined() || info[1]->IsUndefined()) {
		return Nan::ThrowError(Exception::Error(Nan::New("Missing required arguments \'udid\' and \'appPath\'").ToLocalChecked()));
	}

	// validate the 'udid'
	if (!info[0]->IsString()) {
		return Nan::ThrowError(Exception::Error(Nan::New("Argument \'udid\' must be a string").ToLocalChecked()));
	}

	Handle<String> udidHandle = Handle<String>::Cast(info[0]);
	if (udidHandle->Length() == 0) {
		return Nan::ThrowError(Exception::Error(Nan::New("The \'udid\' must not be an empty string").ToLocalChecked()));
	}

	String::Utf8Value udidValue(udidHandle->ToString());
	char* udid = *udidValue;
	CFStringRef udidStr = CFStringCreateWithCString(NULL, (char*)*udidValue, kCFStringEncodingUTF8);

	if (!CFDictionaryContainsKey(connected_devices, (const void*)udidStr)) {
		CFRelease(udidStr);
		snprintf(tmp, 256, "Device \'%s\' not connected", udid);
		return Nan::ThrowError(Exception::Error(Nan::New(tmp).ToLocalChecked()));
	}

	Device* deviceObj = (Device*)CFDictionaryGetValue(connected_devices, udidStr);
	CFRelease(udidStr);
	am_device* device = &deviceObj->device;

	// validate the 'appPath'
	if (!info[1]->IsString()) {
		return Nan::ThrowError(Exception::Error(Nan::New("Argument \'appPath\' must be a string").ToLocalChecked()));
	}

	Handle<String> appPathHandle = Handle<String>::Cast(info[1]);
	if (appPathHandle->Length() == 0) {
		return Nan::ThrowError(Exception::Error(Nan::New("The \'appPath\' must not be an empty string").ToLocalChecked()));
	}

	String::Utf8Value appPathValue(appPathHandle->ToString());
	char* appPath = *appPathValue;

	// check the file exists
	if (::access(appPath, F_OK) != 0) {
		snprintf(tmp, 256, "The app path \'%s\' does not exist", appPath);
		return Nan::ThrowError(Exception::Error(Nan::New(tmp).ToLocalChecked()));
	}

	// get the path to the app
	CFStringRef appPathStr = CFStringCreateWithCString(NULL, (char*)*appPathValue, kCFStringEncodingUTF8);
	CFURLRef relativeUrl = CFURLCreateWithFileSystemPath(NULL, appPathStr, kCFURLPOSIXPathStyle, false);
	CFURLRef localUrl = CFURLCopyAbsoluteURL(relativeUrl);
	CFRelease(appPathStr);
	CFRelease(relativeUrl);

	mach_error_t rval;

	if (deviceObj->connected) {
		AMDeviceStopSession(*device);
		AMDeviceDisconnect(*device);
	}

	// connect to the device
	rval = AMDeviceConnect(*device);
	if (rval == MDERR_SYSCALL) {
		return Nan::ThrowError(Exception::Error(Nan::New("Failed to connect to device: setsockopt() failed").ToLocalChecked()));
	} else if (rval == MDERR_QUERY_FAILED) {
		return Nan::ThrowError(Exception::Error(Nan::New("Failed to connect to device: the daemon query failed").ToLocalChecked()));
	} else if (rval == MDERR_INVALID_ARGUMENT) {
		return Nan::ThrowError(Exception::Error(Nan::New("Failed to connect to device: invalid argument, USBMuxConnectByPort returned 0xffffffff").ToLocalChecked()));
	} else if (rval != MDERR_OK) {
		snprintf(tmp, 256, "Failed to connect to device (0x%x)", rval);
		return Nan::ThrowError(Exception::Error(Nan::New(tmp).ToLocalChecked()));
	}

	// make sure we're paired
	rval = AMDeviceIsPaired(*device);
	if (rval != 1) {
		rval = AMDevicePair(*device);
		if (rval != 1) {
			return Nan::ThrowError(Exception::Error(Nan::New("Device is not paired").ToLocalChecked()));
		}
	}

	// double check the pairing
	rval = AMDeviceValidatePairing(*device);
	if (rval != MDERR_OK) {
		rval = AMDevicePair(*device);
		if (rval != 1) {
			return Nan::ThrowError(Exception::Error(Nan::New("Failed to pair device").ToLocalChecked()));
		} else {
			rval = AMDeviceValidatePairing(*device);
			if (rval == MDERR_INVALID_ARGUMENT) {
				return Nan::ThrowError(Exception::Error(Nan::New("Device is not paired: the device is null").ToLocalChecked()));
			} else if (rval == MDERR_DICT_NOT_LOADED) {
				return Nan::ThrowError(Exception::Error(Nan::New("Device is not paired: load_dict() failed").ToLocalChecked()));
			} else if (rval != MDERR_OK) {
				snprintf(tmp, 256, "Device is not paired (0x%x)", rval);
				return Nan::ThrowError(Exception::Error(Nan::New(tmp).ToLocalChecked()));
			}
		}
	}

	// start the session
	rval = AMDeviceStartSession(*device);
	if (rval == MDERR_INVALID_ARGUMENT) {
		return Nan::ThrowError(Exception::Error(Nan::New("Failed to start session: the lockdown connection has not been established").ToLocalChecked()));
	} else if (rval == MDERR_DICT_NOT_LOADED) {
		return Nan::ThrowError(Exception::Error(Nan::New("Failed to start session: load_dict() failed").ToLocalChecked()));
	} else if (rval != MDERR_OK) {
		snprintf(tmp, 256, "Failed to start session (0x%x)", rval);
		return Nan::ThrowError(Exception::Error(Nan::New(tmp).ToLocalChecked()));
	}

	deviceObj->connected = true;

	CFStringRef keys[] = { CFSTR("PackageType") };
	CFStringRef values[] = { CFSTR("Developer") };
	CFDictionaryRef options = CFDictionaryCreate(NULL, (const void **)&keys, (const void **)&values, 1, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);

	// copy .app to device
	rval = AMDeviceSecureTransferPath(0, *device, localUrl, options, NULL, 0);
	if (rval != MDERR_OK) {
		AMDeviceStopSession(*device);
		AMDeviceDisconnect(*device);
		deviceObj->connected = false;
		CFRelease(options);
		CFRelease(localUrl);
		if (rval == -402653177) {
			return Nan::ThrowError(Exception::Error(Nan::New("Failed to copy app to device: can't install app that contains symlinks").ToLocalChecked()));
		} else {
			snprintf(tmp, 256, "Failed to copy app to device (0x%x)", rval);
			return Nan::ThrowError(Exception::Error(Nan::New(tmp).ToLocalChecked()));
		}
	}

	// install package on device
	rval = AMDeviceSecureInstallApplication(0, *device, localUrl, options, NULL, 0);
	if (rval != MDERR_OK) {
		AMDeviceStopSession(*device);
		AMDeviceDisconnect(*device);
		deviceObj->connected = false;
		CFRelease(options);
		CFRelease(localUrl);
		if (rval == -402620395) {
			return Nan::ThrowError(Exception::Error(Nan::New("Failed to install app on device: most likely a provisioning profile issue").ToLocalChecked()));
		} else {
			snprintf(tmp, 256, "Failed to install app on device (0x%x)", rval);
			return Nan::ThrowError(Exception::Error(Nan::New(tmp).ToLocalChecked()));
		}
	}

	// cleanup
	AMDeviceStopSession(*device);
	AMDeviceDisconnect(*device);
	deviceObj->connected = false;
	CFRelease(options);
	CFRelease(localUrl);

	info.GetReturnValue().SetUndefined();
}

/**
 * Handles new data from the socket when listening for a device's syslog messages.
 */
void LogSocketCallback(CFSocketRef s, CFSocketCallBackType type, CFDataRef address, const void *data, void *info) {
	Device* device = (Device*)info;
	Local<Function> callback = Nan::New<Function>(device->logCallback->callback);
	CFIndex length = CFDataGetLength((CFDataRef)data);
	const char *buffer = (const char*)CFDataGetBytePtr((CFDataRef)data);
	char* str = new char[length + 1];
	long i = 0;
	long j = 0;
	char c;
	Handle<Value> argv[1];

	while (length) {
		while (*buffer == '\0') {
			buffer++;
			length--;
			if (length == 0)
				return;
		}

		i = j = 0;

		while (i < length) {
			c = str[j] = buffer[i++];
			if (c == '\n' || c == '\0') {
				str[j] = '\0';
				if (j > 0) {
					argv[0] = Nan::New(str).ToLocalChecked();
					callback->Call(Nan::GetCurrentContext()->Global(), 1, argv);
				}
				j = 0;
				if (c == '\0') {
					break;
				}
			} else {
				++j;
			}
		}

		length -= i;
		buffer += i;
	}

	delete[] str;
}

/*
 * log()
 * Connects to the device and fires the callback with each line of output from
 * the device's syslog.
 */
NAN_METHOD(log) {
	char tmp[256];

	if (info.Length() < 2 || info[0]->IsUndefined() || info[1]->IsUndefined()) {
		return Nan::ThrowError(Exception::Error(Nan::New("Missing required arguments \'udid\' and \'appPath\'").ToLocalChecked()));
	}

	// validate the 'udid'
	if (!info[0]->IsString()) {
		return Nan::ThrowError(Exception::Error(Nan::New("Argument \'udid\' must be a string").ToLocalChecked()));
	}

	Handle<String> udidHandle = Handle<String>::Cast(info[0]);
	if (udidHandle->Length() == 0) {
		return Nan::ThrowError(Exception::Error(Nan::New("The \'udid\' must not be an empty string").ToLocalChecked()));
	}

	String::Utf8Value udidValue(udidHandle->ToString());
	char* udid = *udidValue;
	CFStringRef udidStr = CFStringCreateWithCString(NULL, (char*)*udidValue, kCFStringEncodingUTF8);

	if (!CFDictionaryContainsKey(connected_devices, (const void*)udidStr)) {
		CFRelease(udidStr);
		snprintf(tmp, 256, "Device \'%s\' not connected", udid);
		return Nan::ThrowError(Exception::Error(Nan::New(tmp).ToLocalChecked()));
	}

	if (!info[1]->IsFunction()) {
		return Nan::ThrowError(Exception::Error(Nan::New("Argument \'callback\' must be a function").ToLocalChecked()));
	}

	Listener* logCallback = new Listener;
	logCallback->callback.Reset(Local<Function>::Cast(info[1]));

	Device* deviceObj = (Device*)CFDictionaryGetValue(connected_devices, udidStr);
	CFRelease(udidStr);

	am_device* device = &deviceObj->device;
	mach_error_t rval;
	service_conn_t connection;

	if (!deviceObj->connected) {
		// connect to the device
		rval = AMDeviceConnect(*device);
		if (rval == MDERR_SYSCALL) {
			return Nan::ThrowError(Exception::Error(Nan::New("Failed to connect to device: setsockopt() failed").ToLocalChecked()));
		} else if (rval == MDERR_QUERY_FAILED) {
			return Nan::ThrowError(Exception::Error(Nan::New("Failed to connect to device: the daemon query failed").ToLocalChecked()));
		} else if (rval == MDERR_INVALID_ARGUMENT) {
			return Nan::ThrowError(Exception::Error(Nan::New("Failed to connect to device: invalid argument, USBMuxConnectByPort returned 0xffffffff").ToLocalChecked()));
		} else if (rval != MDERR_OK) {
			snprintf(tmp, 256, "Failed to connect to device (0x%x)", rval);
			return Nan::ThrowError(Exception::Error(Nan::New(tmp).ToLocalChecked()));
		}

		// make sure we're paired
		rval = AMDeviceIsPaired(*device);
		if (rval != 1) {
			rval = AMDevicePair(*device);
			if (rval != 1) {
				return Nan::ThrowError(Exception::Error(Nan::New("Device is not paired").ToLocalChecked()));
			}
		}

		// double check the pairing
		rval = AMDeviceValidatePairing(*device);
		if (rval != MDERR_OK) {
			rval = AMDevicePair(*device);
			if (rval != 1) {
				return Nan::ThrowError(Exception::Error(Nan::New("Failed to pair device").ToLocalChecked()));
			} else {
				rval = AMDeviceValidatePairing(*device);
				if (rval == MDERR_INVALID_ARGUMENT) {
					return Nan::ThrowError(Exception::Error(Nan::New("Device is not paired: the device is null").ToLocalChecked()));
				} else if (rval == MDERR_DICT_NOT_LOADED) {
					return Nan::ThrowError(Exception::Error(Nan::New("Device is not paired: load_dict() failed").ToLocalChecked()));
				} else if (rval != MDERR_OK) {
					snprintf(tmp, 256, "Device is not paired (0x%x)", rval);
					return Nan::ThrowError(Exception::Error(Nan::New(tmp).ToLocalChecked()));
				}
			}
		}

		// start the session
		rval = AMDeviceStartSession(*device);
		if (rval == MDERR_INVALID_ARGUMENT) {
			return Nan::ThrowError(Exception::Error(Nan::New("Failed to start session: the lockdown connection has not been established").ToLocalChecked()));
		} else if (rval == MDERR_DICT_NOT_LOADED) {
			return Nan::ThrowError(Exception::Error(Nan::New("Failed to start session: load_dict() failed").ToLocalChecked()));
		} else if (rval != MDERR_OK) {
			snprintf(tmp, 256, "Failed to start session (0x%x)", rval);
			return Nan::ThrowError(Exception::Error(Nan::New(tmp).ToLocalChecked()));
		}

		deviceObj->connected = true;
	}

	rval = AMDeviceStartService(*device, CFSTR(AMSVC_SYSLOG_RELAY), &connection, NULL);
	if (rval != MDERR_OK) {
		AMDeviceStopSession(*device);
		if (rval == MDERR_SYSCALL) {
			snprintf(tmp, 256, "Failed to start \"%s\" service due to system call error (0x%x)", AMSVC_SYSLOG_RELAY, rval);
		} else if (rval == MDERR_INVALID_ARGUMENT) {
			snprintf(tmp, 256, "Failed to start \"%s\" service due to invalid argument (0x%x)", AMSVC_SYSLOG_RELAY, rval);
		} else {
			snprintf(tmp, 256, "Failed to start \"%s\" service (0x%x)", AMSVC_SYSLOG_RELAY, rval);
		}
		return Nan::ThrowError(Exception::Error(Nan::New(tmp).ToLocalChecked()));
	}

	AMDeviceStopSession(*device);
	AMDeviceDisconnect(*device);
	deviceObj->connected = false;

	CFSocketContext socketCtx = { 0, deviceObj, NULL, NULL, NULL };
	CFSocketRef socket = CFSocketCreateWithNative(kCFAllocatorDefault, connection, kCFSocketDataCallBack, LogSocketCallback, &socketCtx);
	if (!socket) {
		return Nan::ThrowError(Exception::Error(Nan::New("Failed to create socket").ToLocalChecked()));
	}

	CFRunLoopSourceRef source = CFSocketCreateRunLoopSource(kCFAllocatorDefault, socket, 0);
	if (!source) {
		return Nan::ThrowError(Exception::Error(Nan::New("Failed to create socket run loop source").ToLocalChecked()));
	}

	CFRunLoopAddSource(CFRunLoopGetMain(), source, kCFRunLoopCommonModes);

	if (deviceObj->logCallback) {
		delete deviceObj->logCallback;
	}
	if (deviceObj->logSource) {
		CFRelease(deviceObj->logSource);
	}
	if (deviceObj->logSocket) {
		CFRelease(deviceObj->logSocket);
	}

	deviceObj->logConnection = connection;
	deviceObj->logSocket = socket;
	deviceObj->logSource = source;
	deviceObj->logCallback = logCallback;

	info.GetReturnValue().SetUndefined();
}

static void cleanup(void *arg) {
	// free up connected devices
	CFIndex size = CFDictionaryGetCount(connected_devices);
	CFStringRef* keys = (CFStringRef*)malloc(size * sizeof(CFStringRef));
	CFDictionaryGetKeysAndValues(connected_devices, (const void **)keys, NULL);
	CFIndex i = 0;

	for (; i < size; i++) {
		Device* device = (Device*)CFDictionaryGetValue(connected_devices, keys[i]);
		CFDictionaryRemoveValue(connected_devices, keys[i]);

		if (device->connected) {
			AMDeviceStopSession(device->device);
			AMDeviceDisconnect(device->device);
		}

		if (device->logCallback) {
			delete device->logCallback;
		}
		if (device->logSource) {
			CFRelease(device->logSource);
		}
		if (device->logSocket) {
			CFRelease(device->logSocket);
		}

		delete device;
	}

	free(keys);

	// free up listeners
	size = CFDictionaryGetCount(listeners);
	keys = (CFStringRef*)malloc(size * sizeof(CFStringRef));
	CFDictionaryGetKeysAndValues(listeners, (const void **)keys, NULL);
	i = 0;

	for (; i < size; i++) {
		CFDictionaryRemoveValue(listeners, keys[i]);
	}

	free(keys);
}

/*
 * Wire up the JavaScript functions, initialize the dictionaries, and subscribe
 * to the device notifications.
 */
void init(Handle<Object> exports) {
	exports->Set(Nan::New("on").ToLocalChecked(),          Nan::New<FunctionTemplate>(on)->GetFunction());
	exports->Set(Nan::New("pumpRunLoop").ToLocalChecked(), Nan::New<FunctionTemplate>(pump_run_loop)->GetFunction());
	exports->Set(Nan::New("devices").ToLocalChecked(),     Nan::New<FunctionTemplate>(devices)->GetFunction());
	exports->Set(Nan::New("installApp").ToLocalChecked(),  Nan::New<FunctionTemplate>(installApp)->GetFunction());
	exports->Set(Nan::New("log").ToLocalChecked(),         Nan::New<FunctionTemplate>(log)->GetFunction());

	listeners = CFDictionaryCreateMutable(NULL, 0, &kCFTypeDictionaryKeyCallBacks, NULL);
	connected_devices = CFDictionaryCreateMutable(NULL, 0, &kCFTypeDictionaryKeyCallBacks, NULL);

	am_device_notification notification;
	AMDeviceNotificationSubscribe(&on_device_notification, 0, 0, NULL, &notification);

	node::AtExit(cleanup);
}

#define ADDON_MODULE2(ver, fn) NODE_MODULE(node_ios_device_v ## ver, fn)
#define ADDON_MODULE(ver, fn) ADDON_MODULE2(ver, fn)

// in Node.js 0.8, NODE_MODULE_VERSION is (1) and the parenthesis mess things up
#if NODE_MODULE_VERSION > 1
	ADDON_MODULE(NODE_MODULE_VERSION, init)
#else
	ADDON_MODULE(1, init)
#endif