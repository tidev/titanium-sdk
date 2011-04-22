#!/usr/bin/env python

import os, sys
from androidsdk import *

if len(sys.argv) == 1:
	print "Usage: %s <android-sdk>" % sys.argv[0]
	sys.exit(1)


sdk = AndroidSDK(sys.argv[1])
devices = sdk.list_devices()

json = "["
for device in devices:
	json += "{\"name\": \"%s\", \"port\": %d, \"is_emulator\": %s, \"is_offline\": %s}" % (device.get_name(), device.get_port(), str(device.is_emulator()).lower(), str(device.is_offline()).lower())
json += "]"

print json
