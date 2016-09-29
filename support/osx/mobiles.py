#!/usr/bin/env python 
#
# Appcelerator Titanium Mobile
# Copyright (c) 2009 Appcelerator, Inc. All Right Reserved.
#
# Mobile Phone USB prober
#

import os,sys,subprocess


template_dir = os.path.abspath(os.path.dirname(sys._getframe(0).f_code.co_filename))
prober = os.path.join(template_dir,'usbprobe')

found = []

devices = [
    [1452,4752,'iphone2g'],             # iPhone 2G
    [1452,4753,'iphone-touch'],         # iPhone/iPod Touch
    [1452,4754,'iphone3g'],             # iPhone 3G

    [2996,3073,'android-htc-tmobile'],  # Android T-Mobile GPhone 1 (HTC)
    [2996,3074,'android-htc-google'],   # Android Google Dev Phone (HTC)
]

# device check
for device in devices:
    rc = subprocess.call([prober,str(device[0]),str(device[1]),'1'])
    if rc == 0:
	    found.append(device[2])

print ','.join(found)

sys.exit(len(found))
