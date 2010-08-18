#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Tail an application log file running in the iPhone Simulator
#

import os, sys, subprocess, time, signal, run, filetail

def find_file(folder, fname):
    for root, dirs, files in os.walk(folder):
        for file in files:
            # make search case insensitive
            if fname==file:
                return os.path.join(root, fname)
    return None

def main(args):
	if len(args)!=3:
		print "%s <logname> <version>" % os.path.basename(args[0])
		sys.exit(1)
		
	logname = args[1]
	iphone_version = args[2]
	
	# starting in SDK 3.2 they changed the directory on us where logs 
	# go so we have to compensate for that by looking at the version
	# of xcode the user has
	try:
		xoutput = run.run(["xcodebuild","-version"])
		idx = xoutput.find("Xcode ")
		version = xoutput[idx+6:]
		idx = version.find("\n")
		version = version[0:idx].strip()
		version_split = version.split('.')
		major = int(version_split[0])
		minor = int(version_split[1])
		build = 0
		# some versions are simply 3.1 (2 digits)
		if len(version_split) > 2:
			build = int(version_split[2])
	except:
		sys.exit(0)
	
	
	# this was the default up until 3.2.2 release
	path = "~/Library/Application Support/iPhone Simulator/User/Applications"
	
	# check for >= Xcode 3.2.2 which is when the new log directory started for the simulator
	if major > 3 or major == 3 and minor > 2 or major == 3 and minor == 2 and build >= 2:
		path = "~/Library/Application Support/iPhone Simulator/%s/Applications" % iphone_version

	if iphone_version == '4.0':
	    # i dunno, how many of these will they do?
	    for v in ('4.0.3','4.0.2','4.0.1'):
	        if os.path.exists(os.path.expanduser("~/Library/Application Support/iPhone Simulator/%s"%v)):
        		# Apple broke version in 4.0.x where they return 4.0 instead so we need to try and see if they 
        		# have the patch installed
        		print "[INFO] Found %s patch installed" % v
        		path = "~/Library/Application Support/iPhone Simulator/%s" % v
        		break

	logfile_dir = os.path.expanduser(path)

	logfile = None

	while logfile == None:
		try:
			sys.stdout.flush()
			logfile = find_file(logfile_dir,logname)
			if logfile == None:
					time.sleep(1)
		except KeyboardInterrupt:
			sys.exit(0)

	def handler(signum, frame):
		sys.exit(0)
	
	signal.signal(signal.SIGHUP, handler)
	signal.signal(signal.SIGINT, handler)
	signal.signal(signal.SIGQUIT, handler)
	signal.signal(signal.SIGABRT, handler)
	signal.signal(signal.SIGTERM, handler)
	
	t = filetail.Tail(logfile)
	sys.stdout.flush()
	try:
	  	for line in t:
	  		print line
			sys.stdout.flush()
	except:
		sys.stdout.flush()
		sys.exit(0)
	
	
		
if __name__ == "__main__":
    main(sys.argv)
		
