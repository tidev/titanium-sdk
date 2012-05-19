#!/usr/bin/env python
# Kill a running Android JDWP (debuggable) process without Eclipse

import os, sys, traceback, androidsdk

if len(sys.argv) < 4:
	print >>sys.stderr, "Usage: %s <android_sdk> <device_id> <app_id>" % sys.argv[0]
	sys.exit(1)

android_sdk = sys.argv[1]
device_id = sys.argv[2]
app_id = sys.argv[3]

sdk = androidsdk.AndroidSDK(android_sdk)
try:
	sdk.jdwp_kill(app_id, adb_args=['-s', device_id])
except Exception, e:
	print >>sys.stderr, 'Error killing App %s on Device %s' % (app_id, device_id)
	traceback.print_exc()
