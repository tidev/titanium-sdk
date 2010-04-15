#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Check the pre-requisites for Android development
#

import os, sys, subprocess, re, platform, run

from androidsdk import *

	
def check_java():
	try:
		if platform.system() == "Windows":
			run.run(['cmd.exe','/C','javac','-version'])
		else:
			run.run(['javac','-version'])	
	except:
		print "Missing Java SDK. Please make sure Java SDK is on your PATH"
		sys.exit(1)

def check_android1_6():
	try:
		sdk = AndroidSDK(None, 4)
	except Exception, e:
		print "Missing Android 1.6 SDK: %s" % e
		sys.exit(2)

def main(args):
	check_java()
	check_android1_6()
	sys.exit(0)

if __name__ == "__main__":
    main(sys.argv)

