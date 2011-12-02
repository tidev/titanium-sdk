#! /usr/bin/env python
#
# Appcelerator Titanium Mobile
# Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
# Licensed under the terms of the Apache Public License
# Please see the LICENSE included with this distribution for details.
#
# Generates an index file used by require
# to test if a file exists in the assets folder.

import os, sys, simplejson

def generateJSON(projectDir, outFile):
	index = {}
	for dirpath, dirnames, filenames in os.walk(projectDir):
		for name in filenames:
			relative_path = dirpath[len(projectDir)+1:].replace("\\", "/")
			index["/".join([relative_path , name])] = 1
	simplejson.dump(index, open(outFile, "w"))

if __name__ == "__main__":
	if len(sys.argv) < 3:
		print """Usage: %s <projectDir> <outFile>
  projectDir: path to the directory being indexed
              (Should be path to the app's assets folder)
  outFile:    path where the JSON index file should be written.
""" % sys.argv[0]
		sys.exit(1)

	generateJSON(sys.argv[1], sys.argv[2])
