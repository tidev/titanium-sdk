#!/usr/bin/env python
# -*- coding: utf-8 -*-
#
# Android AVD Listing Script
#
import os, platform, subprocess, sys, run
import run
from androidsdk import AndroidSDK

def dequote(s):
    if s[0:1] == '"':
        return s[1:-1]
    return s

def get_avds(sdk):
	avds = []
	
	name = None
	theid = None
	skins = None
	abis = None
	
	for line in run.run([sdk.get_android(),'list','target'],debug=False).split("\n"):
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
			skins = line[7:].replace(' (default)','').strip().split(", ")
		elif line.find("ABIs : ") != -1:
			abis = line[7:].strip().split(", ")
			avds.append({'name':name,'id':theid,'skins':skins,'abis':abis})
	
	return avds
		

if __name__ == '__main__':
	if len(sys.argv) != 2:
		print "Usage: %s <directory>" % os.path.basename(sys.argv[0])
		sys.exit(1)

	sdk = AndroidSDK(os.path.expanduser(dequote(sys.argv[1])))
	print get_avds(sdk)

