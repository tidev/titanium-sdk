#!/usr/bin/env python
#
# Appcelerator Titanium Mobile
# Copyright (c) 2009 Appcelerator, Inc. All Right Reserved.
#
# Check the pre-requisites for Android development
#

import os, sys, subprocess, re

def run(args):
	return subprocess.Popen(args, stderr=subprocess.PIPE, stdout=subprocess.PIPE).communicate()[0]
	
def check_java():
	try:
		run(['javac','-version'])	
	except:
		print "Missing Java SDK. Please make sure Java SDK is on your PATH"
		sys.exit(1)
		
def check_for_one_five(dir):
	p = os.path.join(dir,'android')
	p2 = os.path.join(dir,'android.exe')
	if os.path.exists(p) or os.path.exists(p2):
		sdk_dir = os.path.normpath(os.path.join(dir,'../'))
		one_five = os.path.join(sdk_dir,'platforms','android-1.5')
		if os.path.exists(one_five):
			print sdk_dir
			return True
	return False		
			
def check_android1_5():
	path = os.environ['PATH']
	for dir in path.split(os.pathsep):
		if check_for_one_five(dir):
			return True
	
	# check some common locations
	for dir in [
				'/opt/android/tools',
				'/usr/android/tools',
				'/opt/android-sdk/tools',
				'/usr/android-sdk/tools',
				'/usr/android-1.5/tools',
				'/opt/android-1.5/tools'
				]:
		if check_for_one_five(dir):
			return True
				
	print "Missing Android 1.5 SDK"
	sys.exit(2)
		
def main(args):
	check_java()
	check_android1_5()
	sys.exit(0)

if __name__ == "__main__":
    main(sys.argv)

