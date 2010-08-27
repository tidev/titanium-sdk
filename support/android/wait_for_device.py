#!/usr/bin/python
# wait for an android emulator / device to be ready for pushing apps (a bit more reliable than adb wait-for-device)

import os, sys, androidsdk, time

def wait_for_device(sdk, type, hard_timeout=20):
	print "[DEBUG] Waiting for device to be ready ..."

	t = time.time()
	max_wait = 30
	max_zero = 6
	attempts = 0
	zero_attempts = 0
	timed_out = True
	no_devices = False

	while True:
		devices = sdk.list_devices()
		print "[TRACE] adb devices returned %s devices/emulators" % len(devices)
		if len(devices) > 0:
			found = False
			for device in devices:
				if type == "e" and device.is_emulator() and not device.is_offline(): found = True
				elif type == "d" and device.is_device(): found = True
			if found:
				timed_out = False
				break
		else: zero_attempts += 1

		try: time.sleep(5) # for some reason KeyboardInterrupts get caught here from time to time
		except KeyboardInterrupt: pass
		attempts += 1
		if attempts == max_wait:
			break
		elif zero_attempts == max_zero:
			no_devices = True
			break

	if timed_out:
		if type == "e":
			device = "emulator"
			extra_message = "you may need to close the emulator and try again"
		else:
			device = "device"
			extra_message = "you may try reconnecting the USB cable"
		print "[ERROR] Timed out waiting for %s to be ready, %s" % (device, extra_message)
		if no_devices:
			sys.exit(1)
		return False

	print "[DEBUG] Device connected... (waited %d seconds)" % (attempts*5)
	duration = time.time() - t

	print "[DEBUG] waited %f seconds on emulator to get ready" % duration
	if duration > 1.0:
		print "[INFO] Waiting for the Android Emulator to become available"
		time.sleep(hard_timeout) # give it a little more time to get installed

if __name__ == "__main__":
	if len(sys.argv) == 1:
		print 'Usage: %s <path/to/android-sdk> (device|emulator)' % sys.argv[0]
		sys.exit(-1)

	sdk = androidsdk.AndroidSDK(sys.argv[1], 4)

	hard_timeout = 20
	type = "e"
	if len(sys.argv) > 2:
		if sys.argv[2] == "device":
			type = "d"

	if len(sys.argv) > 3:
		hard_timeout = int(sys.argv[3])

	wait_for_device(sdk, type, hard_timeout)
