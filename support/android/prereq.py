#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Check the pre-requisites for Android development
#

import os, sys, subprocess, re, platform, run
from androidsdk import *
	
def check_java():
	failed = False
	status = "OK"
	try:
		if platform.system() == "Windows":
			(out,err) = subprocess.Popen(['cmd.exe','/C','javac','-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
		else:
			(out,err) = subprocess.Popen(['javac','-version'], stdout=subprocess.PIPE, stderr=subprocess.PIPE).communicate()
		
		# javac prints it's version on stderr
		MIN_JAVAC = ["1", "6", "0"]
		version = err.replace("javac ", "").strip()
		version_split = version.split(".")
		if version_split < MIN_JAVAC:
			status = "JDK version %s detected, but at least %s is required" % (version, ".".join(MIN_JAVAC))
			failed = True
	except Exception,e:
		status = "Missing Java SDK. Please make sure Java SDK is on your PATH (exception: %s)" % e
		failed = True
	
	return (failed, status)

def check_android_sdk():
	failed = False
	status = "OK"
	try:
		sdk = AndroidSDK(None)
		status = sdk.get_android_sdk()
	except Exception, e:
		status = "Missing default Android SDK: %s" % e
		failed = True
	
	return (failed, status)

def main(args):
	(java_failed, java_status) = check_java()
	if java_failed:
		print java_status
		sys.exit(1)
	
	(android_failed, android_status) = check_android_sdk()
	if android_failed:
		print android_status
		sys.exit(2)
	
	print android_status
	sys.exit(0)

if __name__ == "__main__":
    main(sys.argv)

