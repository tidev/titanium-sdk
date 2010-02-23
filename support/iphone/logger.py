#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Tail an application log file running in the iPhone Simulator
#

import os, sys, subprocess, time, signal, run

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
	
	
	# this was the default up until 3.2.2 release
	path = "~/Library/Application Support/iPhone Simulator/User/Applications"
	
	# check for >= Xcode 3.2.2 which is when the new log directory started for the simulator
	if major > 3 or major == 3 and minor > 2 or major == 3 and minor == 2 and build >= 2:
		path = "~/Library/Application Support/iPhone Simulator/%s/Applications" % iphone_version

	logfile_dir = os.path.expanduser(path)

	logfile = None

	while logfile == None:
		try:
			logfile = find_file(logfile_dir,logname)
			if logfile == None:
					time.sleep(1)
		except KeyboardInterrupt:
			sys.exit(0)

	log = subprocess.Popen([
		'tail',
		'-F',
		logfile
	],bufsize=1)	
	
	def handler(signum, frame):
		if not log == None:
			os.system("kill -9 %d >/dev/null" % log.pid)
		sys.exit(0)
	
	signal.signal(signal.SIGHUP, handler)
	signal.signal(signal.SIGINT, handler)
	signal.signal(signal.SIGQUIT, handler)
	signal.signal(signal.SIGABRT, handler)
	signal.signal(signal.SIGTERM, handler)
	
	# wait for process to end or until we get a signal
	os.waitpid(log.pid,0)
	
	# just to be sure...
	handler(3,None)
	
	sys.exit(0)
	
		
if __name__ == "__main__":
    main(sys.argv)
		
