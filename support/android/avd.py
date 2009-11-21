#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Android AVD Listing Script
#
import os, subprocess, sys, run
import run

def get_avds(sdk):
	avds = []
	
	name = None
	theid = None
	
	android = os.path.join(sdk,'tools','android')
	
	for line in run.run([android,'list','target'],debug=False).split("\n"):
		line = line.strip()
		if line.find("id: ")!=-1:
			theid = line[4:]
			theid = theid[0:theid.find('or ')-1]
		if line.find("Name:")!=-1:
			name = line[6:]
		elif line.find("Based on ")!=-1:
			version = line[9:]
			version = version[0:version.find('(')-1]
			name = "%s %s" % (name,version)
		elif line.find("Skins: ")!=-1:
			skins = line[8:].replace(' (default)','').split(", ")
			avds.append({'name':name,'id':theid,'skins':skins})
			
	return avds
		

if __name__ == '__main__':
	if len(sys.argv) != 2:
		print "Usage: %s <directory>" % os.path.basename(sys.argv[0])
		sys.exit(1)

	print get_avds(os.path.expanduser(sys.argv[1]))

