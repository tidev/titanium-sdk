#!/usr/bin/env python
#
# Appcelerator Titanium Mobile
# Copyright (c) 2009 Appcelerator, Inc. All Right Reserved.
#
# Tail an application log file running in the iPhone Simulator
#

import os, sys, subprocess, time, signal

def find_file(folder, fname):
    for root, dirs, files in os.walk(folder):
        for file in files:
            # make search case insensitive
            if fname==file:
                return os.path.join(root, fname)
    return None

def main(args):
	if len(args)!=2:
		print "%s <logname>" % os.path.basename(args[0])
		sys.exit(1)

	logname = args[1]
	logfile_dir = os.path.expanduser("~/Library/Application Support/iPhone Simulator/User/Applications")

	print logfile_dir

	logfile = None

	while logfile == None:
		logfile = find_file(logfile_dir,logname)
		if logfile == None:
			time.sleep(1)

	log = subprocess.Popen([
		'tail',
		'-F',
		logfile
	])	

	def handler(signum, frame):
		print "signal caught: %d" % signum
		if not log == None:
			print "calling log kill on %d" % log.pid
			os.system("kill -9 %d" % log.pid)
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
		