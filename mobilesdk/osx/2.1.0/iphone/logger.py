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
	
	path = os.path.expanduser("~/Library/Application Support/iPhone Simulator/%s") % iphone_version
	# i dunno, how many of these will they do?
	for v in ('9','8','7','6','5','4','3','2','1'):
		full_version = "%s.%s"%(iphone_version,v)
		possible_path = os.path.expanduser("~/Library/Application Support/iPhone Simulator/%s"%full_version)
		if os.path.exists(possible_path):
			print "[INFO] Found %s patch installed" % full_version
			path = possible_path
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
		
