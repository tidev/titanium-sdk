/**
 * node-ios-device
 * Copyright (c) 2013-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "runloop.h"
#include "device.h"
#include "mobiledevice.h"
#include "util.h"
#include <CoreFoundation/CoreFoundation.h>
#include <thread>

namespace node_ios_device {

const double notificationWait = 0.5;

CFMutableDictionaryRef connectedDevices;
std::mutex deviceMutex;
CFRunLoopRef runloop;
std::timed_mutex initMutex;
static bool initialized = false;
static am_device_notification deviceNotification = NULL;
static CFRunLoopTimerRef initTimer;

static void stopInitTimer() {
	if (initTimer) {
		debug("Removing init timer from run loop");
		::CFRunLoopTimerInvalidate(initTimer);
		::CFRunLoopRemoveTimer(runloop, initTimer, kCFRunLoopCommonModes);
		::CFRelease(initTimer);
		initTimer = NULL;
	}
}

static void unlockInitMutex(CFRunLoopTimerRef timer, void* info) {
	initialized = true;
	initMutex.unlock();
	stopInitTimer();
}

static void createInitTimer() {
	// set a timer for 250ms to unlock the initMutex
	CFRunLoopTimerContext timerContext = { 0, NULL, NULL, NULL, NULL };
	initTimer = ::CFRunLoopTimerCreate(
		kCFAllocatorDefault, // allocator
		CFAbsoluteTimeGetCurrent() + notificationWait, // fireDate
		0, // interval
		0, // flags
		0, // order
		unlockInitMutex,
		&timerContext
	);

	debug("Adding init timer to run loop");
	::CFRunLoopAddTimer(runloop, initTimer, kCFRunLoopCommonModes);
}

/**
 * The callback when a device notification is received.
 */
static void on_device_notification(am_device_notification_callback_info* info, void* arg) {
	bool changed = false;

	debug("Resetting timer due to new device notification");
	stopInitTimer();

	// ensure that the device is connected via USB
	if (::AMDeviceGetInterfaceType(info->dev) == 1) {
		if (info->msg == ADNCI_MSG_CONNECTED) {
			std::lock_guard<std::mutex> lock(deviceMutex);
			node_ios_device::Device* device = new node_ios_device::Device(info->dev);

			if (!::CFDictionaryContainsKey(connectedDevices, device->udid)) {
				node_ios_device::debug("Device connected");

				try {
					device->init();

					// if we already have the device info, don't get it again
					if (device->loaded && !::CFDictionaryContainsKey(connectedDevices, device->udid)) {
						::CFDictionarySetValue(connectedDevices, device->udid, device);
						changed = true;
					}
				} catch (...) {
					node_ios_device::debug("Failed to init device");
					delete device;
				}
			}

		} else if (info->msg == ADNCI_MSG_DISCONNECTED) {
			std::lock_guard<std::mutex> lock(deviceMutex);
			CFStringRef udid = ::AMDeviceCopyDeviceIdentifier(info->dev);

			if (::CFDictionaryContainsKey(connectedDevices, udid)) {
				// remove the device from the dictionary and destroy it
				node_ios_device::Device* device = (node_ios_device::Device*)::CFDictionaryGetValue(connectedDevices, udid);
				::CFDictionaryRemoveValue(connectedDevices, udid);

				node_ios_device::debug("Device disconnected: %s", device->props["udid"].c_str());

				delete device;
				changed = true;
			}
		}
	}

	if (!initialized) {
		createInitTimer();
	}

	// we need to notify if devices changed and this must be done outside the
	// scopes above so that the mutex is unlocked
	if (changed) {
		node_ios_device::send("devicesChanged");
	}
}

/**
 * Starts the run loop.
 */
void startRunLoop() {
	connectedDevices = ::CFDictionaryCreateMutable(NULL, 0, &kCFTypeDictionaryKeyCallBacks, NULL);

	node_ios_device::debug("Subscribing to device notifications");
	::AMDeviceNotificationSubscribe(&on_device_notification, 0, 0, NULL, &deviceNotification);

	runloop = ::CFRunLoopGetCurrent();

	createInitTimer();

	node_ios_device::debug("Starting CoreFoundation run loop");
	::CFRunLoopRun();
}

/**
 * Stops the run loop.
 */
void stopRunLoop() {
	// free up connected devices
	CFIndex size = ::CFDictionaryGetCount(connectedDevices);
	CFStringRef* keys = (CFStringRef*)::malloc(size * sizeof(CFStringRef));
	::CFDictionaryGetKeysAndValues(connectedDevices, (const void **)keys, NULL);
	CFIndex i = 0;

	for (; i < size; i++) {
		Device* device = (Device*)::CFDictionaryGetValue(connectedDevices, keys[i]);
		::CFDictionaryRemoveValue(connectedDevices, keys[i]);
		delete device;
	}

	::free(keys);
	::CFRelease(connectedDevices);
	::AMDeviceNotificationUnsubscribe(deviceNotification);
	stopInitTimer();
	::CFRunLoopStop(runloop);
}

} // end namespace node_ios_device
